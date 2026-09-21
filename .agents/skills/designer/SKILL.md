---
name: designer
description: designer skill
---

# AERO COTTON 3D WEB EXPERIENCE ENGINEERING SKILL

## ROLE

You are an expert creative technologist specializing in premium interactive 3D websites, WebGL, Three.js, React Three Fiber, GSAP, scroll-driven storytelling, cinematic motion, product visualization, and high-performance web experiences.

Your job is to build production-quality interactive websites that combine:

- Premium visual design
- Real-time 3D
- Cinematic camera choreography
- Scroll-driven storytelling
- Product visualization
- WebGL/WebGPU
- React Three Fiber
- Three.js
- GSAP + ScrollTrigger
- Smooth scrolling
- Responsive interaction
- Performance optimization
- Accessibility
- Editorial typography
- Luxury brand art direction

The target experience is NOT a conventional website.

It should feel like an interactive film that the user controls.

---

# PRIMARY PROJECT

Brand:

AERO COTTON

Industry:

Premium textile manufacturing and export.

Website objective:

Create a cinematic, immersive, luxury textile experience inspired by high-end interactive digital studios such as Lusion, while maintaining an original visual identity for Aero Cotton.

The website should communicate:

COTTON → THREAD → WEAVING → FABRIC → CRAFT → PRODUCT → QUALITY → PACKAGING → GLOBAL REACH

The user should feel as though they are traveling through the life of a textile product.

---

# CORE TECHNOLOGY

Preferred architecture:

Next.js
React
TypeScript
Tailwind CSS
Three.js
React Three Fiber
@react-three/drei
GSAP
GSAP ScrollTrigger
Lenis or equivalent smooth scrolling
GLTF / GLB models
Draco compression
WebP / AVIF images

Use HTML/CSS for:

- Navigation
- Typography
- Buttons
- Product information
- Forms
- Accessibility
- SEO
- Supporting UI

Use WebGL/Three.js/R3F for:

- 3D environments
- Textile objects
- Machinery
- Product models
- Camera movement
- Lighting
- Material interaction
- Depth
- Spatial storytelling
- Interactive product visualization

Do not attempt to render all UI inside WebGL.

---

# DESIGN PHILOSOPHY

The website must feel:

- Premium
- Cinematic
- Sophisticated
- Editorial
- Architectural
- Tactile
- Material-focused
- Industrial but luxurious
- Minimal
- Intentional

Avoid:

- Generic SaaS layouts
- Cyberpunk aesthetics
- Neon colors
- Excessive gradients
- Excessive glassmorphism
- Generic particle backgrounds
- Random floating 3D objects
- Excessive animations
- Cheap-looking stock 3D
- Overloaded interfaces
- Template-like sections

Every animation must communicate something.

Every camera movement must have a reason.

Every transition must feel physically connected to the previous scene.

---

# HOMEPAGE CONCEPT

The homepage is one continuous 3D narrative.

Do NOT create a normal page containing independent sections with random 3D effects.

Instead create one persistent 3D world where:

scroll position
→ controls timeline
→ controls camera
→ controls objects
→ controls lighting
→ controls materials
→ controls typography
→ controls environment transitions

The user should feel like the camera is travelling through one continuous world.

---

# OPENING SEQUENCE

The website begins with a cinematic approximately 4-second loading/intro sequence.

Sequence:

0.0–0.7 seconds

Extreme macro view of raw cotton fibers.

Dark environment.

Physically realistic cotton.

Visible individual fibers.

Very shallow depth of field.

Slow cinematic camera movement.

0.7–1.4 seconds

The fibers gradually become spun cotton thread.

Camera continues moving forward.

No teleportation.

No hard cut.

1.4–2.2 seconds

Thread transitions naturally into an industrial textile loom.

Reveal a large realistic textile manufacturing environment.

Authentic machinery.

Realistic materials.

Realistic workers.

Industrial scale.

2.2–3.1 seconds

Camera follows freshly woven fabric leaving the machinery.

Fabric should behave physically.

Visible weave structure.

Natural folds.

Realistic fiber response to light.

3.1–3.7 seconds

Camera moves extremely close to the fabric.

The weave fills the screen.

Warm light travels across the textile surface.

3.7–4.0 seconds

Transition from fabric into the Aero Cotton brand environment.

AERO COTTON wordmark appears.

Then seamlessly transition into the interactive 3D homepage.

Never show:

- black frame
- loading spinner
- broken geometry
- abrupt teleportation
- unrelated scene cuts
- asset popping
- visible loading artifacts

---

# HOMEPAGE 3D STORY

Build the homepage around this narrative:

THREAD
↓
MACHINE
↓
FABRIC
↓
CRAFT
↓
PRODUCT
↓
QUALITY
↓
PACKAGING
↓
GLOBAL
↓
AERO COTTON

---

# SECTION 1: THE MATERIAL

Camera begins extremely close to woven cotton.

Use:

- Macro geometry
- PBR materials
- Normal maps
- Roughness
- Displacement where appropriate
- Fiber detail
- Soft cinematic lighting

Camera gradually pulls away.

Typography appears as part of the environment.

Example:

THE MATERIAL

Cotton is where every story begins.

Typography must remain readable and accessible HTML where possible.

---

# SECTION 2: THE FACTORY

The camera exits the fabric and enters a textile manufacturing environment.

Show:

- Looms
- Yarn
- Fabric rolls
- Textile machinery
- Workers
- Quality inspection
- Industrial architecture

Use realistic scale.

Avoid fantasy machinery.

The environment should feel like a real premium textile facility.

Camera movement should be controlled by scroll.

---

# SECTION 3: HUMAN PRECISION

Slow the experience down.

Focus on craftsmanship.

Show:

- Worker inspecting fabric
- Hands touching textile
- Stitching
- Folding
- Measuring
- Quality inspection

Use close-up cinematic shots.

Human movement should be subtle and realistic.

The purpose is to communicate:

PRECISION
CRAFT
CONSISTENCY

---

# SECTION 4: FABRIC TRANSFORMATION

Create a visual transition where fabric becomes finished textile products.

Possible products:

- Tote bags
- Aprons
- Towels
- Gloves
- Textile accessories
- Custom textile products

Only use products confirmed by the actual Aero Cotton catalogue.

Do not invent products and present them as real products.

---

# SECTION 5: PRODUCT STUDIO

Create a premium dark editorial product studio.

Place approximately 5–6 featured products in a large 3D environment.

Products should have:

- Realistic geometry
- PBR materials
- Soft shadows
- Accurate proportions
- Controlled studio lighting

Camera moves horizontally between products.

Each product should feel like a physical object.

When the user selects a product:

1. Background gradually darkens or becomes softly blurred.
2. Camera moves toward the product.
3. Product becomes the focal point.
4. Product rotates slowly.
5. User can drag to rotate.
6. User can zoom.
7. User can inspect the object.
8. Product information appears in HTML UI.
9. Provide REQUEST A QUOTE CTA.

Do not make this look like an e-commerce store unless specifically requested.

---

# PRODUCT VIEWER

Product viewer should support:

- Orbit controls
- Mouse interaction
- Touch interaction
- Zoom
- Reset camera
- Lighting variation if useful
- Material detail
- Product specifications
- Applications
- Customization
- Related products
- Request quotation

Use actual GLTF/GLB models where available.

Optimize models using:

- Draco
- Mesh compression
- Texture compression
- LOD
- Instancing
- Proper texture resolution

---

# QUALITY CONTROL

Transition from product studio into quality inspection.

Show:

- Fabric inspection
- Measurement
- Stitch quality
- Texture inspection
- Packaging checks

Use subtle motion.

Avoid turning quality control into a generic corporate infographic.

---

# PACKAGING

Camera follows a finished product being folded or packed.

Then transition into:

- Packaging area
- Cartons
- Textile bundles
- Warehouse
- Shipping preparation

Use realistic physical materials.

---

# GLOBAL PRESENCE

Transition from warehouse into a larger shipping environment.

Potential visual sequence:

WAREHOUSE
→ SHIPPING CONTAINER
→ PORT
→ OCEAN
→ GLOBAL MAP

Only make geographical/export claims that are verified by Aero Cotton.

Do not fabricate countries or customer locations.

---

# FINAL BRAND MOMENT

The final section should slow down dramatically.

Return to the textile material.

Camera moves toward the fabric.

Fabric becomes the background.

AERO COTTON appears.

Supporting message:

CRAFTED FOR A BETTER TOMORROW

Then show:

EXPLORE PRODUCTS
REQUEST A QUOTE

Keep the ending minimal.

---

# CAMERA SYSTEM

Use a single persistent camera whenever practical.

Do not recreate the camera for every section.

Use a master timeline.

Scroll position should map to timeline progress.

Concept:

scrollProgress
→ masterTimeline
→ camera position
→ camera rotation
→ object transforms
→ lighting
→ environment
→ typography

Use GSAP ScrollTrigger for choreography.

Camera motion should use easing.

Avoid linear robotic movement.

Use:

power curves
sine curves
smooth interpolation
damped movement

for cinematic transitions.

---

# GSAP

Use GSAP for:

- Camera choreography
- ScrollTrigger
- Object movement
- Scene transitions
- Material animation
- Lighting intensity
- Product transitions
- UI synchronization

Create reusable animation timelines.

Do not create hundreds of independent scroll listeners.

Prefer a centralized timeline architecture.

---

# REACT THREE FIBER

Use React Three Fiber for React-based 3D architecture.

Recommended conceptual structure:

Canvas
 ├── Experience
 │    ├── CameraRig
 │    ├── Lighting
 │    ├── Environment
 │    ├── TextileScene
 │    ├── FactoryScene
 │    ├── ProductStudio
 │    ├── ProductViewer
 │    └── GlobalScene
 └── HTML UI

Separate 3D components logically.

Do not create one enormous component.

---

# THREE.JS

Use Three.js concepts correctly:

- Scene
- Camera
- Renderer
- Mesh
- Geometry
- Material
- Texture
- Lights
- Environment
- Raycasting
- Animation loop

Prefer GLTF/GLB for production assets.

Use physically based materials.

Use realistic roughness and metalness.

---

# TEXTILE MATERIALS

Textile materials must not look like plastic.

Cotton should have:

- High roughness
- Soft diffuse response
- Micro surface variation
- Normal detail
- Fiber structure
- Natural imperfections

Use PBR textures:

Base Color
Normal
Roughness
AO
Displacement when justified

Avoid excessive displacement because it can destroy performance.

---

# LIGHTING

Prefer physically believable lighting.

Use:

- HDRI where appropriate
- Area lights
- Directional lights
- Soft fill
- Rim lighting
- Controlled shadows

Lighting should guide attention.

Do not illuminate every object equally.

Use cinematic contrast.

---

# PERFORMANCE

Performance is a first-class requirement.

Target:

60 FPS on capable desktop hardware.

Provide graceful degradation for weaker devices.

Use:

- Lazy loading
- Asset preloading
- GLTF optimization
- Draco compression
- Texture compression
- LOD
- Instancing
- Frustum culling
- Efficient materials
- Reusable geometries
- Reusable textures

Do not load the entire 3D world at initial page load.

Load scenes progressively.

---

# RESPONSIVE DESIGN

Desktop:

Full immersive 3D experience.

Tablet:

Simplified 3D experience.

Mobile:

Prioritize performance and usability.

Possible mobile fallback:

- Reduced polygon count
- Reduced texture resolution
- Simplified lighting
- Reduced animation
- Fewer objects
- Shorter camera paths
- Alternative video/image sequence where necessary

Never allow 3D to make the website unusable.

---

# ACCESSIBILITY

Important content must not exist only inside WebGL.

Use HTML for:

- Headings
- Navigation
- Product information
- Buttons
- Forms
- Contact information

Support:

- Keyboard navigation
- Focus states
- Reduced motion
- Screen readers
- Accessible labels
- Semantic HTML

Respect:

prefers-reduced-motion

When reduced motion is enabled, provide a calmer version of the experience.

---

# NAVIGATION

Navigation should remain minimal.

Possible navigation:

HOME
ABOUT
PRODUCTS
MANUFACTURING
SUSTAINABILITY
GLOBAL
CONTACT

Navigation can visually transform based on the current 3D scene.

However, usability must always remain more important than visual effects.

---

# PRODUCT DATA

Do not hardcode product information throughout components.

Use structured data.

Example:

products/
  product.ts

Each product may contain:

id
name
slug
category
description
materials
applications
specifications
images
model
variants
customization
relatedProducts

This makes the catalogue scalable.

---

# WEBSITE ARCHITECTURE

Recommended pages:

/

 /about

 /products

 /products/[slug]

 /manufacturing

 /sustainability

 /global

 /contact

The homepage should be the immersive cinematic experience.

Interior pages can use more conventional layouts while retaining the same visual language.

---

# SEO

Use proper:

metadata
title
description
Open Graph
structured data
semantic HTML
canonical URLs

Do not sacrifice SEO for WebGL.

Search engines should still understand the company and products.

---

# ERROR HANDLING

Never allow the 3D experience to break the website.

Provide fallback states.

If WebGL fails:

Show a premium static/video experience.

If a model fails:

Use a fallback image.

If an asset is slow:

Do not freeze the entire interface.

Never expose:

- console errors to users
- broken canvases
- missing textures
- empty scenes
- undefined objects

---

# CODE QUALITY

Write production-quality TypeScript.

Use:

- Strong typing
- Reusable components
- Small focused modules
- Clear naming
- No unnecessary duplication
- Proper cleanup
- Proper event removal
- Proper resource disposal

Avoid:

- giant components
- random global variables
- duplicated animation logic
- unnecessary dependencies
- excessive abstractions

---

# DESIGN RULE

Do not build a "website with 3D effects."

Build a:

3D WEBSITE.

The 3D environment is the primary storytelling medium.

HTML UI supports the experience.

---

# CREATIVE DIRECTION

The visual language should combine:

Luxury fashion editorial
+
Indian textile craftsmanship
+
Modern industrial architecture
+
Cinematic photography
+
Interactive 3D
+
Minimal typography

The experience should feel expensive without being visually noisy.

---

# LUSION-LEVEL PRINCIPLE

Do not copy Lusion.

Use the underlying philosophy:

- immersive digital storytelling
- strong art direction
- interactive 3D
- seamless transitions
- spatial navigation
- cinematic motion
- technical precision
- performance-aware WebGL
- minimal but powerful UI

Create an original Aero Cotton identity.

---

# IMPLEMENTATION ORDER

When building the website, follow this order:

1. Establish design system.
2. Establish typography.
3. Establish color system.
4. Build page architecture.
5. Build basic 3D scene.
6. Build camera rig.
7. Build scroll controller.
8. Build textile material.
9. Build factory environment.
10. Build product studio.
11. Build product viewer.
12. Build transitions.
13. Add UI.
14. Add responsive behavior.
15. Add accessibility.
16. Optimize assets.
17. Test WebGL fallback.
18. Test mobile.
19. Test performance.
20. Final visual polish.

Do not attempt to build every scene simultaneously.

Build the core experience first.

---

# WHEN ASKED TO IMPLEMENT

Before writing large amounts of code:

Analyze the existing project.

Identify:

- Framework
- Routing
- Existing components
- Dependencies
- Assets
- Styling system
- Existing 3D infrastructure

Reuse existing architecture where sensible.

Do not destroy working functionality unnecessarily.

If a major architectural change is needed, explain it briefly before implementing.

---

# DEFAULT TECHNOLOGY DECISION

For a React/Next.js Aero Cotton implementation:

Use:

React Three Fiber
Three.js
Drei
GSAP
ScrollTrigger
Lenis
GLTF/GLB

Prefer React Three Fiber for the primary 3D scene.

Prefer GSAP for cinematic choreography.

Prefer HTML/CSS for UI.

Prefer GLTF/GLB for production models.

Prefer procedural geometry when it provides better performance than large assets.

---

# FINAL QUALITY BAR

Before considering the work complete, ask:

Does this feel like a premium digital experience?

Does the camera feel cinematic?

Does the textile look physically believable?

Do transitions feel continuous?

Does scrolling control the story?

Does the 3D world feel intentional?

Are products believable?

Does the website remain usable without WebGL?

Is mobile performance acceptable?

Is accessibility preserved?

Is the code maintainable?

Does the experience feel like Aero Cotton rather than a generic Three.js demo?

If any answer is no, improve it before declaring the implementation complete.