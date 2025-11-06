import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { db, bucket, admin } from "./services/firebase.js";
import { generateReactNativeProjectZip } from "./lib/generator.js";
import { triggerBuild } from "./lib/cloudBuild.js";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
app.use(helmet()); app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("tiny"));

app.get("/health", (req,res)=>res.json({ok:true, service:"ai-appgen-api", project:process.env.FIREBASE_PROJECT_ID||null}));

app.post("/generate", async (req,res)=>{
  try{
    const { prompt } = req.body||{};
    if(!prompt) return res.status(400).json({error:"prompt is required"});
    const uid = (req.headers["x-demo-uid"] || "demo-user");
    const appId = uuidv4();
    const workDir = `/tmp/work-${appId}`;
    const srcDir = `${workDir}/src`; const zipPath = `${workDir}/source.zip`;

    const files = await generateReactNativeProjectZip({ prompt, srcDir, zipPath, appId });

    const bucketName = process.env.APP_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    if(!bucketName) throw new Error("APP_BUCKET or FIREBASE_STORAGE_BUCKET is required");
    await bucket.upload(zipPath, { destination: `users/${uid}/apps/${appId}/source.zip`, metadata:{contentType:"application/zip"}});
    const sourceZipPath = `users/${uid}/apps/${appId}/source.zip`;

    const appDoc = {
      uid, prompt, framework:"react-native",
      bucket: bucketName,
      sourceZipPath,
      apkPath: `users/${uid}/apps/${appId}/outputs/app-debug.apk`,
      status: "BUILD_QUEUED",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("apps").doc(appId).set(appDoc,{merge:true});

    const region = process.env.CLOUD_BUILD_REGION || "global";
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const buildId = await triggerBuild({ projectId, region, appId, uid, bucket: bucketName, sourceZipGcs: `gs://${bucketName}/${sourceZipPath}` });

    await db.collection("apps").doc(appId).set({ status:"BUILDING", buildId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, {merge:true});

    res.json({ appId, files: files.map(f=>f.path).slice(0,10), sourceZipUrl:`gs://${bucketName}/${sourceZipPath}`, buildId, status:"BUILDING"});
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

app.get("/apps/:id", async (req,res)=>{
  try{
    const { id } = req.params;
    const snap = await db.collection("apps").doc(id).get();
    if(!snap.exists) return res.status(404).json({error:"not found"});
    const data = snap.data();
    const [sourceExists] = await bucket.file(data.sourceZipPath).exists();
    const [apkExists] = await bucket.file(data.apkPath).exists();
    let sourceZipSigned=null, apkSigned=null;
    if(sourceExists){
      const [url] = await bucket.file(data.sourceZipPath).getSignedUrl({action:"read", expires: Date.now()+3600_000});
      sourceZipSigned = url;
    }
    if(apkExists){
      const [url2] = await bucket.file(data.apkPath).getSignedUrl({action:"read", expires: Date.now()+3600_000});
      apkSigned = url2;
    }
    res.json({ ...data, id: snap.id, sourceZipSigned, apkSigned });
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

app.use((req,res)=>res.status(404).json({error:"not found"}));
const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log(`ai-appgen-api listening on ${port}`));
