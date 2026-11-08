import * as THREE from 'three';

export const JOURNAL_ENTRIES = Object.freeze([
  'gnomes','flying-eyes','gremblob','unicorns','shapeshifter','hide-behind','dreamscapes','bill-cipher',
]);

let spreads=[];

/** Both pages share a single source image. UVs split it at the exact gutter. */
export async function preloadJournalArt(onProgress=()=>{}) {
  const loader=new THREE.TextureLoader();let loaded=0;
  spreads=await Promise.all(JOURNAL_ENTRIES.map(async slug=>{
    try{
      const source=await loader.loadAsync(`${import.meta.env.BASE_URL}journal/${slug}.webp`);
      source.colorSpace=THREE.SRGBColorSpace;source.anisotropy=8;
      const left=source.clone(),right=source.clone();
      left.repeat.set(.5,1);left.offset.set(0,0);left.needsUpdate=true;
      right.repeat.set(.5,1);right.offset.set(.5,0);right.needsUpdate=true;
      return {left,right};
    }catch(error){console.warn(`Journal artwork could not load: ${slug}`,error);return null;}
    finally{onProgress(++loaded,JOURNAL_ENTRIES.length);}
  }));
}

export function illustratedPage(index,side) { return spreads[index]?.[side]?.clone() || null; }
