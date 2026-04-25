# Graph Report - pixelforge  (2026-04-25)

## Corpus Check
- 141 files · ~270,025 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1577 nodes · 3058 edges · 45 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1220 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 84 edges
2. `Editor` - 58 edges
3. `SidebarDrawerComponent` - 49 edges
4. `TextToolbarComponent` - 49 edges
5. `PropertyPanelComponent` - 48 edges
6. `Dashboard` - 33 edges
7. `ApiService` - 30 edges
8. `Canvas` - 28 edges
9. `Canvas` - 26 edges
10. `ProjectService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Delete every document matching ``filter``. Return is Motor-specific.` --uses--> `Template`  [INFERRED]
  backend/app/seed/templates_seed.py → backend/app/schemas/template.py
- `_parse_frontend_presets()` --calls--> `Group`  [INFERRED]
  backend/tests/test_platform_preset_parity.py → src/app/features/editor/editor.spec.ts
- `list_projects()` --calls--> `is_connected()`  [INFERRED]
  backend/app/project_routes.py → backend/app/database.py
- `is_connected()` --calls--> `list_comments()`  [INFERRED]
  backend/app/database.py → backend/app/comments_routes.py
- `is_connected()` --calls--> `health_check()`  [INFERRED]
  backend/app/database.py → backend/app/routes.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (6): ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, ImageFiltersPanelComponent, PropertyPanelComponent, TextToolbarComponent

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (7): AuditDialog, CanvasService, makeService(), Canvas, LayerPanelComponent, ResizeDialog, StyleVariationsService

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (109): ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate (+101 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (13): BackgroundPanelComponent, Editor, emptyCanvasFor(), GalleryComponent, setup(), StaticCanvas, templateFactory(), HistoryService (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (87): delete_asset(), get_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively., Stream an asset's bytes from disk.      Args:         asset_id: MongoDB ObjectId, Delete an asset record and its on-disk file.      Args:         asset_id: MongoD (+79 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (77): _infer_platform(), migrate(), Migration 0001 — backfill the ``platform`` field on legacy project rows.  Backgr, Reverse-lookup the platform id that matches ``width`` × ``height``.      Args:, # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse, Backfill ``platform`` on every project row that lacks it.      Args:         db:, Protocol, PaletteSlot (+69 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (7): ApiService, BrandKitApplyService, CommentsOverlay, CommentsService, getPlatformPreset(), ShareDialog, VersionsDialog

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (5): AiBackgroundService, AiDesignService, BackgroundRemovalService, DesignHelperService, SidebarDrawerComponent

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (2): Dashboard, ProjectService

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (34): authInterceptor(), ActiveSelection, bootstrap(), Circle, FabricImage, FabricObject, FabricText, Group (+26 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (42): BrandKit, BrandLogo, get_brand_kit(), Brand kit API: per-user saved colors, fonts, and logos., A single logo entry stored in a brand kit.      Attributes:         id: Stable c, Collection of reusable brand primitives per user.      Attributes:         color, Return the authenticated user's brand kit.      Args:         db: Async Mongo da, Upsert the authenticated user's brand kit.      Args:         body: Full ``Brand (+34 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (45): _png_bytes(), Happy-path coverage for auth_routes endpoints after the Depends refactor., Render a tiny valid PNG via Pillow for avatar-upload tests., POST /api/auth/me/password rotates the password (PX-075)., Wrong ``current`` is rejected with 401 (PX-075)., ``next`` shorter than 6 chars is rejected with 400 (PX-075)., ``next`` identical to ``current`` is rejected (PX-075)., POST /api/auth/me/password without a token returns 401 (PX-075). (+37 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (4): CanvasRulersComponent, CollaborationService, CommandPalette, NewProjectDialog

### Community 14 - "Community 14"
Cohesion: 0.1
Nodes (4): AccessibilityService, QualityScoreService, TemplateService, ThemeService

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (4): AuthComponent, AuthService, ProfileComponent, UserMenuComponent

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (2): ExportDialog, ExportService

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (5): BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg()

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (2): AnimationService, AnimationTimeline

### Community 21 - "Community 21"
Cohesion: 0.2
Nodes (2): ColorPickerComponent, PwaInstallPrompt

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (1): GradientPanelComponent

### Community 24 - "Community 24"
Cohesion: 0.26
Nodes (1): FontService

### Community 25 - "Community 25"
Cohesion: 0.42
Nodes (1): MagicWriteService

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (1): HubComponent

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (1): AlignmentPanelComponent

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (8): Angular CLI, ng build, ng e2e (end-to-end tests), ng generate (scaffolding), ng serve (dev server), ng test (Vitest runner), Pixelforge Project, Vitest

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (2): authGuard(), FakeAuthService

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (2): mkAuthResponse(), setup()

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (1): PluginRegistry

### Community 36 - "Community 36"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 38 - "Community 38"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): GIF

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): App

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

## Knowledge Gaps
- **203 isolated node(s):** `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c`, `Brand kit API: per-user saved colors, fonts, and logos.`, `A single logo entry stored in a brand kit.      Attributes:         id: Stable c` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 9`** (61 nodes): `.createProject()`, `.getPublicTemplate()`, `.listProjects()`, `.listPublicTemplates()`, `Dashboard`, `.clearTemplateFilters()`, `.constructor()`, `.createFromCategory()`, `.createFromPreset()`, `.createFromTemplate()`, `.deleteProject()`, `.duplicateProject()`, `.editTags()`, `.emptyTrash()`, `.filterByTag()`, `.formatDate()`, `.formatRelativeTime()`, `.generateAiDesign()`, `.getPresetIcon()`, `.goToLogin()`, `.goToTab()`, `.loadGallery()`, `.onDragLeave()`, `.onDragOver()`, `.onDrop()`, `.onGalleryClick()`, `.onGallerySearch()`, `.onHomeUpload()`, `.openNewProjectDialog()`, `.permanentDelete()`, `.restoreProject()`, `.setGalleryCategory()`, `.triggerHomeUpload()`, `.useGalleryTemplate()`, `.useSuggestion()`, `.fileMakeCopy()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.syncFromBackend()`, `.updateProject()`, `.removeUpload()`, `project.service.ts`, `dashboard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (25 nodes): `ExportDialog`, `.applyPlatformPreset()`, `.close()`, `.doExport()`, `.setPagesData()`, `.toggleBatchSize()`, `ExportService`, `.dataURLToBlob()`, `.embedStandardFonts()`, `.exportImage()`, `.exportMultiPagePDF()`, `.exportSVG()`, `.exportTransparentPNG()`, `.exportVideo()`, `.exportWithBackground()`, `.parseColor()`, `.renderCircleToPdf()`, `.renderGenericToPdf()`, `.renderImageToPdf()`, `.renderLineToPdf()`, `.renderObjectToPdf()`, `.renderRectToPdf()`, `.renderTextToPdf()`, `export.service.ts`, `export-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (20 nodes): `AnimationService`, `.animate()`, `.applyStartState()`, `.easeOutBounce()`, `.easeOutCubic()`, `.getAnimation()`, `.playAll()`, `.resetAll()`, `.setAnimation()`, `.snapshot()`, `AnimationTimeline`, `.attachWhenReady()`, `.getAnimIcon()`, `.getAnimLabel()`, `.msToPixels()`, `.ngOnDestroy()`, `.ngOnInit()`, `.quickAddAnim()`, `animation.service.ts`, `animation-timeline.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (16 nodes): `ColorPickerComponent`, `.commitHexInput()`, `.composeHex()`, `.emitChange()`, `.onAlphaChange()`, `.onHexChange()`, `.onHexInputChange()`, `.parseColor()`, `.value()`, `PwaInstallPrompt`, `.dismiss()`, `.install()`, `.ngOnDestroy()`, `.ngOnInit()`, `color-picker.component.ts`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (15 nodes): `GradientPanelComponent`, `.addStop()`, `.applyGradient()`, `.applyPreset()`, `.attachWhenReady()`, `.getPresetGradientCSS()`, `.ngOnDestroy()`, `.ngOnInit()`, `.removeStop()`, `.setAngle()`, `.setFillType()`, `.startEyedropper()`, `.updateStopColor()`, `.updateStopOffset()`, `gradient-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (12 nodes): `FontService`, `.constructor()`, `.fileToDataUrl()`, `.getAllFontFamilies()`, `.getGoogleFonts()`, `.loadCustomFonts()`, `.persistCustomFonts()`, `.preloadPopularFonts()`, `.registerFont()`, `.removeCustomFont()`, `.uploadCustomFont()`, `font.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (11 nodes): `MagicWriteService`, `.applySwaps()`, `.generateVariants()`, `.makeLonger()`, `.makeShorter()`, `.removeFillers()`, `.sentenceCase()`, `.titleCase()`, `.toHeadline()`, `.transform()`, `magic-write.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (8 nodes): `AlignmentPanelComponent`, `.align()`, `.attachWhenReady()`, `.autoArrange()`, `.constructor()`, `.distribute()`, `.fixOverlaps()`, `alignment-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (6 nodes): `btn()`, `heading()`, `mkAuthResponse()`, `pills()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (5 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `PluginRegistry`, `.getAll()`, `.getById()`, `.register()`, `plugin-api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `seed_templates()` connect `Community 5` to `Community 2`, `Community 11`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `makeService()` connect `Community 1` to `Community 8`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._