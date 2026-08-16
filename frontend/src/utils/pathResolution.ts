export const getProductImage = (imagePath: string) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/200';
  }

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  const url = `${process.env.NEXT_PUBLIC_IMAGE_URL ?? ''}${imagePath}`;
  console.log("image url: [", url, "]");
  return url;
};

