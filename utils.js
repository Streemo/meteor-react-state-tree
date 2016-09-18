export const isTree = function(obj){
  return typeof obj === "object" && !!obj;
}
// proj: N => S, takes a nested tree and maps it to a non-nested tree.
// Idempotency; proj: S => S is I, the identity.
export const proj = function(tree,val,isCombinatoric,root="",reduced={}){
  if (isTree(tree)){
    for (let k in tree){
      const r = root+(root&&".")+k;
      isCombinatoric && (reduced[r] = tree[k])
      proj(tree[k],val,isCombinatoric,r,reduced)
    }
    return reduced;
  }
  reduced[root] = val || tree;
}