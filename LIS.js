
const nums = [1,2,4,3];
function LIS(nums){
  let dp = new Array(nums.length);
  dp.fill(1);
  for(let i=nums.length-2;i>=0;i--){
    for(let j=i+1;j<nums.length;j++){
      if(nums[i]<nums[j]){
        dp[i] = Math.max(dp[i],1+dp[j]);
      }
    }
  }
  let outputLen = -Infinity
  for(const item of dp){
    if(outputLen < item){
      outputLen = item;
    }
  }
  return outputLen;
  
}
console.log(LIS(nums));