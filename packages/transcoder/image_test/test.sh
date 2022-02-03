#!/bin/sh

rm -rf output
mkdir -p output

cp ../magick .

(cd ./images && ls -1 *.jpg) | while read filename; do
  ./magick convert -auto-orient +repage -profile ./profile.icc -colorspace RGB -thumbnail 160x -set colorspace RGB -colorspace sRGB -depth 8 -strip -quality 90 -interlace JPEG "./images/$filename" "./output/jpg_$filename.jpg"
  ./magick convert -auto-orient +repage -profile ./profile.icc -colorspace RGB -thumbnail 160x -set colorspace RGB -colorspace sRGB -depth 8 -strip -quality 90 -interlace JPEG "./images/$filename" "./output/png_$filename.png"
done
