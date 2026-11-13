import axios from "axios";
import getModel from "../config/llm.js";
import getSystemPrompt from "../utils/system-prompt.js";
import { getFromS3, uploadToS3 } from "../utils/s3.utils.js";
import { URL_EXPIRY } from "../../../lib/constant.js";

export async function imageAgent(state) {
  try {
    const llm = getModel("image");

    const response = await llm.invoke(
      getSystemPrompt("image_description", state.prompt),
    );
    const content = JSON.parse(response.content.trim());
    // console.log(content);
    const systemPrompt = content.imagePrompt.trim();
    const baseName = content.fileName.trim();
    const fileName = `${baseName}-${Date.now()}.png`;

    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(systemPrompt)}`;

    const imgResponse = await axios.get(imgUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(imgResponse.data);

    await uploadToS3(fileName, buffer, "image/png");

    const downloadUrl = await getFromS3(fileName, URL_EXPIRY);

    return {
      ...state,
      aiResponse: `
# Image Generated Successfully.
![Generated Image](${downloadUrl})
[DownLoad Image](${downloadUrl})
_Link will expire in ${URL_EXPIRY / 60} hour(s)._
    `,
    };
  } catch (error) {
    console.error("[Image-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return {
      ...state,
      aiResponse: "Failed to generate image!",
    };
  }
}
