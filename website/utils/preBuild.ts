// All quantum directories now use blogLoader.ts - no prebuild needed!
// Migration completed: quantum/amo, quantum/basics, quantum/hardware, quantum/qml
//
// The following old prebuild steps have been removed:
// - removeMath() - No longer needed (LaTeX rendered client-side)
// - getBlogs() - Replaced by dynamic blogLoader.ts
// - copyImg() - Images copied during vite build

console.log("✅ All quantum directories now use dynamic blogLoader - no prebuild necessary!");
