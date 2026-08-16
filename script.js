let skinViewer;
let currentSkinData = null;

// Initialize 3D Viewer on DOM load
document.addEventListener("DOMContentLoaded", () => {
    if (typeof skinview3d !== "undefined") {
        skinViewer = new skinview3d.SkinViewer({
            canvas: document.getElementById("skinCanvas"),
            width: 300,
            height: 400,
            skin: "https://mc-heads.net/skin/Notch"
        });
        
        skinview3d.createOrbitControls(skinViewer);
        skinViewer.animation = new skinview3d.WalkingAnimation();
        skinViewer.autoRotate = true;
        skinViewer.autoRotateSpeed = 0.5;
    }
});

// Resolve Skin URL for Java & Bedrock (Geyser API)
async function resolveSkinUrl(rawUsername, edition = "auto") {
    let username = rawUsername.trim();
    let isBedrock = (edition === "bedrock") || (edition === "auto" && username.startsWith('.'));

    if (username.startsWith('.')) {
        username = username.substring(1); // Strip leading dot for Bedrock lookup
    }

    if (isBedrock) {
        // Step 1: Get XUID
        const xuidRes = await fetch(`https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(username)}`);
        if (!xuidRes.ok) throw new Error("Bedrock player not found");
        const xuidData = await xuidRes.json();
        if (!xuidData.xuid) throw new Error("XUID not found");

        // Step 2: Get Texture ID
        const skinRes = await fetch(`https://api.geysermc.org/v2/skin/${xuidData.xuid}`);
        if (!skinRes.ok) throw new Error("Bedrock skin not found");
        const skinData = await skinRes.json();
        if (!skinData.texture_id) throw new Error("Skin texture not found");

        return {
            cleanName: username,
            skinUrl: `https://textures.minecraft.net/texture/${skinData.texture_id}`
        };
    } else {
        return {
            cleanName: username,
            skinUrl: `https://mc-heads.net/skin/${username}`
        };
    }
}

// Search and Render Skin
async function searchSkin() {
    const inputVal = document.getElementById("usernameInput").value;
    const edition = document.getElementById("editionSelect").value;
    const errorMsg = document.getElementById("errorMsg");
    const downloadBtn = document.getElementById("viewerDownloadBtn");
    
    if (!inputVal || !skinViewer) return;

    errorMsg.style.display = "none";
    
    try {
        const data = await resolveSkinUrl(inputVal, edition);
        await skinViewer.loadSkin(data.skinUrl);
        
        currentSkinData = data;
        downloadBtn.style.display = "block";
    } catch (err) {
        console.error("Error loading skin:", err);
        errorMsg.style.display = "block";
        downloadBtn.style.display = "none";
    }
}

function downloadCurrentSkin() {
    if (currentSkinData) {
        downloadSkin(currentSkinData.cleanName, currentSkinData.skinUrl);
    }
}

// Download Skin PNG as playername.png
async function downloadSkin(username, skinUrl) {
    try {
        const response = await fetch(skinUrl);
        const blob = await response.blob();
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${username}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error("Download failed:", err);
        window.open(skinUrl, '_blank');
    }
}

// Pause / Play 3D Controls
function toggleAnimation() {
    if (!skinViewer) return;
    if (skinViewer.animation || skinViewer.autoRotate) {
        skinViewer.animation = null;
        skinViewer.autoRotate = false;
    } else {
        skinViewer.animation = new skinview3d.WalkingAnimation();
        skinViewer.autoRotate = true;
    }
}

function handleKeyPress(event) {
    if (event.key === "Enter") searchSkin();
}
