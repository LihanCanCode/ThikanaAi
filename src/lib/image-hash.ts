import sharp from "sharp";

/**
 * Computes an average hash (aHash) for an image URL.
 * Returns a 64-character binary string (0s and 1s).
 */
export async function computeAHash(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize to 8x8, convert to grayscale, and extract raw pixel data
    const { data } = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Compute the mean pixel value
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const mean = sum / data.length;

    // Generate 64-bit binary string
    let hash = "";
    for (let i = 0; i < data.length; i++) {
      hash += data[i] >= mean ? "1" : "0";
    }

    return hash;
  } catch (error) {
    console.error("Error computing aHash for", url, error);
    throw error;
  }
}

/**
 * Computes the Hamming distance between two 64-character binary strings.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must be of equal length");
  }
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}
