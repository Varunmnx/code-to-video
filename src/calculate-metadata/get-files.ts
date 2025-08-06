import { getStaticFiles } from "@remotion/studio";

export interface  Script{
  [key:string] :{
    videoDuration : number
  }
}

export type PublicFolderFile = {
  filename: string;
  value: string;
  audioSrc: string | undefined;
  script:Script
};

export const getFiles = async () => {
  const files = getStaticFiles();
  const codeFiles = files.filter((file) => file.name.startsWith("react-native"));
  const audioFiles = files.filter((file) => file.name.startsWith("audio"));
  const scripts = files.filter((file) => file.name.startsWith("story"));
  console.log(scripts)
  const contents = codeFiles.map(async (file,index): Promise<PublicFolderFile> => {
    const contents = await fetch(file.src);
    const text = await contents.text();
    let script = undefined
    if (scripts[index]){ 
      script = await fetch(scripts[index]?.src);
      script = await script?.json();
    }
    
    return { filename: file.name, value: text, audioSrc: audioFiles[index]?.src ?? undefined, script};
  });

  return Promise.all(contents);
};

/**
 * Extracts the code name from a string in the format "react-native/code1.xml"
 * @param {string} str - The input string
 * @returns {string} The extracted code name
 */
function extractCodeName(str) {
  const regex = /\/([^\/]+)\.xml$/;
  const match = str.match(regex);
  return match && match[1];
}

export async function getAudioWithStory(){
  const audioFiles = getStaticFiles().filter((file) => file.name.startsWith("audio"));
  const scripts = getStaticFiles().filter((file) => file.name.startsWith("story"));
  const codeFiles = getStaticFiles().filter((file) => file.name.startsWith("react-native"));
 
  let script = undefined
 
  const data = audioFiles.map(async (file,index) => { 
    script = await fetch(scripts[index]?.src);
    script = (await script?.json()) as unknown as Script;
    console.log("script",script)
    console.log(codeFiles[index])
    console.log(script[extractCodeName(codeFiles[index]?.name)])

    return {
      audioSrc: file.src,
      videoDuration: script[extractCodeName(codeFiles[index]?.name)]?.videoDuration ?? undefined
    }
  });

  return Promise.all(data);
}