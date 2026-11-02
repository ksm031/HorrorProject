#!/bin/bash
# usage: tools/frames.sh outprefix scale t1 t2 ...
out=$1; sc=$2; shift 2
for t in "$@"; do node tools/snap.js ${out}_$t.png $sc "(()=>{renderAt($t);return fb})()" >/dev/null & done; wait
