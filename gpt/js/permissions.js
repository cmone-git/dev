// Client-side routing helper. Firestore Security Rules must enforce the same permissions server-side.
export function canAccess(user,record){
 if(!user||user.status!=='active') return false;
 if(user.role==='admin') return user.companyId===record.companyId;
 return user.role==='user' && user.companyId===record.companyId && user.branchId===record.branchId;
}
export function isAdmin(user){return user?.role==='admin'}
export function isBranchUser(user){return user?.role==='user' && !!user?.branchId}
