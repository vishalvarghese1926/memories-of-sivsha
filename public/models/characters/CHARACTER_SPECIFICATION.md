# Hero 3D Character Asset Specification Contract
**Project:** Memories of Sivsha  
**Target Platform:** WebGL / Three.js / React Three Fiber (Desktop + Mobile Safari)  
**Characters:**
1. **Vishal** (`/public/models/characters/boy.glb`)
2. **Sivani** (`/public/models/characters/girl.glb`)

---

## 1. Scale, Origin, and Forward Direction
- **File Format:** Binary GLTF (`.glb`) compressed with **Draco** or **Meshopt**.
- **Units:** Real-world Metric (1 unit = 1 meter).
  - Boy Height: $\sim 1.75\text{m}$ ($Y = 0$ to $Y = 1.75$)
  - Girl Height: $\sim 1.62\text{m}$ ($Y = 0$ to $Y = 1.62$)
- **Origin ($0, 0, 0$):** Centered directly between feet at ground plane level ($Y = 0$).
- **Forward Vector:** $+Z$ is Character Forward facing direction in default coordinate system (or $-Z$ standard GLTF; orientation is normalized by root transform).

---

## 2. Rigging & Skeleton Requirements
Standard Humanoid Skeleton (Blender / Mixamo / ARKit humanoid mapping):

```
Hips (Root)
├── Spine
│   └── Spine1
│       └── Spine2
│           ├── Neck
│           │   └── Head
│           │       ├── LeftEye
│           │       └── RightEye
│           ├── LeftShoulder
│           │   └── LeftArm
│           │       └── LeftForeArm
│           │           └── LeftHand
│           │               ├── LeftHandThumb[1-3]
│           │               ├── LeftHandIndex[1-3]
│           │               ├── LeftHandMiddle[1-3]
│           │               ├── LeftHandRing[1-3]
│           │               └── LeftHandPinky[1-3]
│           └── RightShoulder
│               └── RightArm
│                   └── RightForeArm
│                       └── RightHand
│                           ├── RightHandThumb[1-3]
│                           ├── RightHandIndex[1-3]
│                           ├── RightHandMiddle[1-3]
│                           ├── RightHandRing[1-3]
│                           └── RightHandPinky[1-3]
├── LeftUpLeg
│   └── LeftLeg
│       └── LeftFoot
│           └── LeftToeBase
└── RightUpLeg
    └── RightLeg
        └── RightFoot
            └── RightToeBase
```

- **Hands:** Fully articulated with 5 individual fingers (3 bones per finger + thumb) to enable believable object grasping (holding the admission pen, motorcycle handlebars, car door handles, hand-holding).

---

## 3. Facial Morph Targets (Blendshapes)
Facial mesh (head / eyes / mouth) must provide standard ARKit-compatible shape keys:
- `eyeBlinkLeft` & `eyeBlinkRight` (Natural 150ms involuntary blinks)
- `mouthSmileLeft` & `mouthSmileRight` (Warm, subtle emotional smiles)
- `browInnerUp` (Gentle thoughtful expression)
- *(Optional: `jawOpen`, `mouthPucker` for future dialogue)*

---

## 4. Materials & Texturing Standards
- **PBR Workflow:** Standard Metallic-Roughness workflow (`MeshStandardMaterial` / `MeshPhysicalMaterial`).
- **Texture Resolutions:**
  - **Body / Clothing:** $2048 \times 2048$ max (WebP or KTX2 Basis Universal).
  - **Face / Skin:** $2048 \times 2048$ max with clearcoat & roughness maps for subtle skin translucency.
  - **Eyes / Hair:** $1024 \times 1024$.
- **Texture Compression:** Compressed with KTX2 (Basis Universal) or WebP. Uncompressed $4096 \times 4096$ PNGs are strictly forbidden due to mobile iOS Safari memory limits.

---

## 5. Animation Clips Contract
Embedded in the `.glb` or stored as separate modular `.glb` tracks in `/public/animations/`:

| Clip Name | Type | Loop Mode | Description |
| :--- | :--- | :--- | :--- |
| `Idle` | In-place | `THREE.LoopRepeat` | Natural standing breathing with weight shift |
| `Walk` | In-place | `THREE.LoopRepeat` | Smooth grounded walking stride (feet cycle at $Y=0$) |
| `Stand` | In-place | `THREE.LoopRepeat` | Attentive posture standing next to parent or desk |
| `Sit` | In-place | `THREE.LoopRepeat` | Seated posture with thighs horizontal, feet grounded |
| `Look` | In-place | `THREE.LoopRepeat` | Subtle curious glance towards nearby presence |
| `Reach` | Action | `THREE.LoopOnce` | Right arm extends forward with palm ready for handoff |
| `Interact` | Action | `THREE.LoopOnce` | Reaching and grasping prop |
| `Biker` | In-place | `THREE.LoopRepeat` | Hands grasping motorcycle handlebars, torso leaning slightly forward |
| `BikerPillion`| In-place | `THREE.LoopRepeat` | Pillion posture holding rider securely, leaning with road dynamics |

---

## 6. Target Quality Checklist
- [ ] No geometric box or primitive stick figure styling
- [ ] Realistic / stylized-realistic human proportions
- [ ] Detailed sculpted facial features with natural eye catchlights
- [ ] Stylized hair volume with natural silhouette
- [ ] Wrinkled tailored clothing geometry
- [ ] Total polygon budget: 25,000 to 45,000 triangles per hero character (well within iPhone WebGL budget when paired with active milestone culling).
