export async function uploadJSONToIPFS(data: unknown): Promise<{ cid: string; url: string }> {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (!token) {
    throw new Error('Missing Web3.Storage token. Set NEXT_PUBLIC_WEB3_STORAGE_TOKEN.');
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const res = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: await blob.text(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IPFS upload failed: ${text}`);
  }
  const { cid } = await res.json();
  const url = `https://w3s.link/ipfs/${cid}`;
  return { cid, url };
}

export async function uploadFilesToIPFS(files: File[]): Promise<{ cid: string; url: string }> {
  const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
  if (!token) {
    throw new Error('Missing Web3.Storage token. Set NEXT_PUBLIC_WEB3_STORAGE_TOKEN.');
  }
  const form = new FormData();
  for (const file of files) {
    form.append('file', file, file.name);
  }
  const res = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IPFS upload failed: ${text}`);
  }
  const { cid } = await res.json();
  const url = `https://w3s.link/ipfs/${cid}`;
  return { cid, url };
}
