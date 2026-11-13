import generatePPT from "../utils/generate-ppt.js";
import getModel from "../config/llm.js";
import getSystemPrompt from "../utils/system-prompt.js";
import { getFromS3, uploadToS3 } from "../utils/s3.utils.js";
import { URL_EXPIRY } from "../../../lib/constant.js";

export async function pptAgent(state) {
  try {
    const llm = getModel("ppt");
    const systemPrompt = getSystemPrompt("ppt", state.prompt);

    const response = await llm.invoke(systemPrompt);
    const data = JSON.parse(response.content.trim());

    // console.log(data);

    const ppt = generatePPT(data);
    const fileName = `${data.title}-${Date.now()}.pptx`;
    const buffer = await ppt.write({
      outputType: "nodebuffer",
    });

    await uploadToS3(
      fileName,
      buffer,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );

    const downloadUrl = await getFromS3(fileName, URL_EXPIRY);

    return {
      ...state,
      aiResponse: `
# PPt Generated

**${data.title}**

[DownLoad PPT](${downloadUrl})
_Link will expire in ${URL_EXPIRY / 60} hour(s)._
      `,
    };
  } catch (error) {
    console.error("[PPT-Agent Error]", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    return {
      ...state,
      aiResponse: "Failed to generate ppt!",
    };
  }
}
