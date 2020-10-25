import { sendMessageToContentScript } from "./common.js";
const fileInput = document.getElementById("file");
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });
}
fileInput.addEventListener("change", async (e) => {
  const files = await Promise.all(
    [].map.call(fileInput.files, async (file) => {
      const { name, type } = file;
      const base64 = await fileToBase64(file);
      return {
        name,
        type,
        base64,
      };
    })
  );
  console.log(files);
  sendMessageToContentScript({
    cmd: "UPLOAD",
    data: {
      files,
    },
  });
});
