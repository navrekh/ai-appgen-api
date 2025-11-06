import { CloudBuildClient } from "@google-cloud/cloudbuild";

export async function triggerBuild({ projectId, region="global", appId, uid, bucket, sourceZipGcs }){
  const client = new CloudBuildClient();
  const objectPath = sourceZipGcs.replace(`gs://${bucket}/`, "");
  const build = {
    source: { storageSource: { bucket, object: objectPath } },
    steps: [],
    substitutions: { APP_ID: appId, UID: uid, BUCKET: bucket },
    options: { logging: "CLOUD_LOGGING_ONLY" }
  };
  const [operation] = await client.createBuild({ projectId, build });
  const buildId = operation.metadata.build.id;
  return buildId;
}
