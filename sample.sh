
# 冒頭 12.5 分間 (750秒) をサンプリング
ffmpeg -i input.mp4 -vf "select='lte(t,750)*not(mod(t,30))',scale=320:-1,tile=5x5" -frames:v 1 summary.jpg

