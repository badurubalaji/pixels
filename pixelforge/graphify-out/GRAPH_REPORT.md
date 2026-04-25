# Graph Report - pixelforge  (2026-04-25)

## Corpus Check
- 141 files · ~1,246,794 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1586 nodes · 3090 edges · 51 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 1239 edges (avg confidence: 0.77)
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
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `CanvasService` - 86 edges
2. `Editor` - 58 edges
3. `PropertyPanelComponent` - 52 edges
4. `SidebarDrawerComponent` - 49 edges
5. `TextToolbarComponent` - 49 edges
6. `Dashboard` - 33 edges
7. `ApiService` - 31 edges
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
- `is_connected()` --calls--> `get_brand_kit()`  [INFERRED]
  backend/app/database.py → backend/app/brand_routes.py
- `is_connected()` --calls--> `list_comments()`  [INFERRED]
  backend/app/database.py → backend/app/comments_routes.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (7): AnimationService, CanvasService, ClipboardService, ColorPalettePanelComponent, ContextMenuComponent, PropertyPanelComponent, TextToolbarComponent

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (109): ConnectionManager, project_collab_socket(), Real-time collaboration via WebSocket.  Each project has a "room". Connected cli, Tracks active websocket connections per project room., ProjectCreate, ProjectDetailResponse, ProjectResponse, ProjectUpdate (+101 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (77): _infer_platform(), migrate(), Migration 0001 — backfill the ``platform`` field on legacy project rows.  Backgr, Reverse-lookup the platform id that matches ``width`` × ``height``.      Args:, # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse, Backfill ``platform`` on every project row that lacks it.      Args:         db:, Protocol, PaletteSlot (+69 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (80): AuthResponse, create_token(), decode_token(), get_current_user(), hash_password(), PasswordChange, Requires authenticated user or raises 401., Partial-update payload for the authenticated user's own profile.      Fields def (+72 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (21): AiBackgroundService, AiDesignService, delete_asset(), get_asset(), list_assets(), Asset upload / retrieval / deletion endpoints.  Assets are stored on-disk under, Upload an image asset, persist to disk, record metadata in Mongo.      Args:, # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively. (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (5): makeService(), Editor, Canvas, HistoryService, KeyboardService

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (8): BackgroundPanelComponent, BrandKitService, decodeSvgDataUrl(), encodeSvgToDataUrl(), isSvgDataUrl(), sanitizeSvg(), DesignHelperService, SidebarDrawerComponent

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (6): ApiService, BrandKitApplyService, CommentsService, getPlatformPreset(), ShareDialog, VersionsDialog

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (18): ActiveSelection, Canvas, Circle, EventEmitter, FabricImage, FabricObject, FabricText, FakeImage (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (6): ExportDialog, ExportService, setup(), StaticCanvas, templateFactory(), ResizeDialog

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (5): AccessibilityService, FontService, QualityScoreService, TemplateService, ThemeService

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (5): AuditDialog, CanvasRulersComponent, CollaborationService, CommandPalette, NewProjectDialog

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (45): _png_bytes(), Happy-path coverage for auth_routes endpoints after the Depends refactor., Render a tiny valid PNG via Pillow for avatar-upload tests., POST /api/auth/me/password rotates the password (PX-075)., Wrong ``current`` is rejected with 401 (PX-075)., ``next`` shorter than 6 chars is rejected with 400 (PX-075)., ``next`` identical to ``current`` is rejected (PX-075)., POST /api/auth/me/password without a token returns 401 (PX-075). (+37 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (30): ActiveSelection, bootstrap(), Circle, FabricImage, FabricObject, FabricText, Group, IText (+22 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (33): close_db(), connect_db(), get_db(), is_connected(), Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB, Return the MongoDB database handle.      Raises a clear error if the DB is not c, lifespan(), FastAPI lifespan: open/close Mongo and optionally seed starter templates.      A (+25 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (4): AuthComponent, AuthService, ProfileComponent, UserMenuComponent

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (9): authInterceptor(), emptyCanvasFor(), GalleryComponent, PresentationMode, normalizeHex(), remapObject(), TemplateThumbnailService, The ``custom`` preset is the user-defined sentinel at 0x0. (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (1): ProjectService

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (21): author_all(), _build_canvas_json(), _fabric_circle(), _fabric_rect(), _fabric_text(), _load_default_font(), _pick(), Programmatic authoring of 20 starter templates (PX-022b).  This module is an *au (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.1
Nodes (19): Happy-path coverage for asset_routes endpoints after the Depends refactor.  Exte, PX-003 AC-7: SVG with relative-fragment href (#id) passes validation., PX-003 AC-7: SVG with on* attributes is rejected., GET /api/assets returns [] when none uploaded., PX-003 AC-7: malformed XML is rejected before any other processing., POST /api/assets/upload then DELETE /api/assets/{id} round-trip., PX-003 AC-6: a clean, well-formed SVG uploads successfully., PX-003 AC-7: <script> in uploaded SVG is rejected (400). (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (1): CommentsOverlay

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (1): ImageFiltersPanelComponent

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (2): Canvas, FabricObject

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (1): GradientPanelComponent

### Community 24 - "Community 24"
Cohesion: 0.2
Nodes (1): AnimationTimeline

### Community 25 - "Community 25"
Cohesion: 0.42
Nodes (1): ColorPickerComponent

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
Cohesion: 0.52
Nodes (1): BackgroundRemovalService

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (1): StaticCanvas

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (5): get_platform_preset(), PlatformPreset, Canonical platform-size presets (backend source of truth).  This module mirrors, Look up a platform preset by id.      Args:         preset_id: The preset id to, One platform-size preset record.      Attributes:         id: Stable identifier

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (2): mkAuthResponse(), setup()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (1): LayerPanelComponent

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (1): PwaInstallPrompt

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (1): Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules

### Community 38 - "Community 38"
Cohesion: 0.4
Nodes (1): PluginRegistry

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (1): CollabOverlay

### Community 41 - "Community 41"
Cohesion: 0.8
Nodes (5): PWA Icon 192x192 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 384x384 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 512x512 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), PWA Icon 96x96 - Stylized 'A' Shield (Pink/Magenta to Purple Gradient), Angular-style Shield 'A' Logo Symbol (Pink-Magenta-Purple Gradient, White Background)

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (4): PWA Icon 128x128 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 144x144 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 152x152 - Stylized 'A' with pink-to-purple gradient on pentagonal shield, PWA Icon 72x72 - Stylized 'A' with pink-to-purple gradient on pentagonal shield

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): StyleVariationsService

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Development server entry point.  Usage:     python run.py     # or     uvicorn a

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): TestRootModule

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): GIF

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): App

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): ShortcutsDialog

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): Require a leading ``#`` followed by 3 or 6 hex digits.          Args:

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): One platform-size preset record.      Attributes:         id: Stable identifier

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Look up a platform preset by id.      Args:         preset_id: The preset id to

## Knowledge Gaps
- **205 isolated node(s):** `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c`, `Brand kit API: per-user saved colors, fonts, and logos.`, `A single logo entry stored in a brand kit.      Attributes:         id: Stable c` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 17`** (24 nodes): `.healthCheck()`, `ProjectService`, `.addUploadedImage()`, `.checkBackend()`, `.constructor()`, `.createProject()`, `.deleteProject()`, `.duplicateProject()`, `.emptyTrash()`, `.getUploadedImages()`, `.loadProjects()`, `.loadUploads()`, `.mergeProjects()`, `.permanentlyDelete()`, `.persistProjects()`, `.persistUploads()`, `.purgeOldTrash()`, `.removeUploadedImage()`, `.restoreProject()`, `.saveCanvasState()`, `.setTags()`, `.updateProject()`, `.removeUpload()`, `project.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (20 nodes): `.addReply()`, `CommentsOverlay`, `.cancelNewComment()`, `.closeMention()`, `.closeThread()`, `.deleteComment()`, `.formatMentions()`, `.knownUsers()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onNewEnter()`, `.onReplyInput()`, `.onReplyKey()`, `.pickMention()`, `.screenX()`, `.screenY()`, `.submitNewComment()`, `.submitReply()`, `.toggleComment()`, `comments-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (19 nodes): `ImageFiltersPanelComponent`, `.applyFilters()`, `.applyPreset()`, `.attachWhenReady()`, `.ngOnDestroy()`, `.ngOnInit()`, `.onBlurChange()`, `.onBrightnessChange()`, `.onContrastChange()`, `.onHueRotationChange()`, `.onNoiseChange()`, `.onPixelateChange()`, `.onSaturationChange()`, `.resetFilters()`, `.toggleGrayscale()`, `.toggleInvert()`, `.toggleSepia()`, `.triggerReplace()`, `image-filters-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (15 nodes): `Canvas`, `.dispose()`, `.getObjects()`, `.getZoom()`, `.off()`, `.on()`, `.renderAll()`, `.requestRenderAll()`, `.setDimensions()`, `.setViewportTransform()`, `.setZoom()`, `constructor()`, `FabricObject`, `getObjects()`, `export.service.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (15 nodes): `GradientPanelComponent`, `.addStop()`, `.applyGradient()`, `.applyPreset()`, `.attachWhenReady()`, `.getPresetGradientCSS()`, `.ngOnDestroy()`, `.ngOnInit()`, `.removeStop()`, `.setAngle()`, `.setFillType()`, `.startEyedropper()`, `.updateStopColor()`, `.updateStopOffset()`, `gradient-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (11 nodes): `AnimationTimeline`, `.attachWhenReady()`, `.getAnimIcon()`, `.getAnimLabel()`, `.msToPixels()`, `.ngOnDestroy()`, `.ngOnInit()`, `.playAll()`, `.quickAddAnim()`, `.previewAnimation()`, `animation-timeline.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (10 nodes): `ColorPickerComponent`, `.commitHexInput()`, `.composeHex()`, `.emitChange()`, `.onAlphaChange()`, `.onHexChange()`, `.onHexInputChange()`, `.parseColor()`, `.value()`, `color-picker.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (9 nodes): `HubComponent`, `.buildTiles()`, `.ngOnInit()`, `.onProjectActivate()`, `.onStartFromScratch()`, `.onTileActivate()`, `.trackProjectById()`, `.trackTileById()`, `hub.component.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (8 nodes): `AlignmentPanelComponent`, `.align()`, `.attachWhenReady()`, `.autoArrange()`, `.constructor()`, `.distribute()`, `.fixOverlaps()`, `alignment-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (7 nodes): `authGuard()`, `FakeAuthService`, `.isAuthenticated()`, `.setAuthenticated()`, `runGuard()`, `auth.guard.spec.ts`, `auth.guard.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (7 nodes): `BackgroundRemovalService`, `.dataURLToBlob()`, `.removeBackground()`, `.removeClientSide()`, `.removeFromDataURL()`, `.removeServerSide()`, `background-removal.service.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (7 nodes): `template-thumbnail.service.spec.ts`, `StaticCanvas`, `.constructor()`, `.dispose()`, `.loadFromJSON()`, `.renderAll()`, `.toDataURL()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (6 nodes): `btn()`, `heading()`, `mkAuthResponse()`, `pills()`, `setup()`, `auth.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (6 nodes): `LayerPanelComponent`, `.onDrop()`, `.setLayerOpacity()`, `.toggleLock()`, `.toggleVisibility()`, `layer-panel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (6 nodes): `PwaInstallPrompt`, `.dismiss()`, `.install()`, `.ngOnDestroy()`, `.ngOnInit()`, `pwa-install-prompt.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (5 nodes): `__init__.py`, `__init__.py`, `__init__.py`, `__init__.py`, `Pydantic v2 schemas for request/response DTOs and domain documents.  Sub-modules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (5 nodes): `PluginRegistry`, `.getAll()`, `.getById()`, `.register()`, `plugin-api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (5 nodes): `CollabOverlay`, `.initial()`, `.screenX()`, `.screenY()`, `collab-overlay.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `style-variations.service.ts`, `StyleVariationsService`, `.getAllStyles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `run.py`, `Development server entry point.  Usage:     python run.py     # or     uvicorn a`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `test-setup.ts`, `TestRootModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `types.d.ts`, `GIF`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `App`, `app.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `ShortcutsDialog`, `shortcuts-dialog.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `Require a leading ``#`` followed by 3 or 6 hex digits.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `Require ``thumbnail_data_url`` to start with ``data:image/``.          Args:`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `One platform-size preset record.      Attributes:         id: Stable identifier`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `Look up a platform preset by id.      Args:         preset_id: The preset id to`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `seed_templates()` connect `Community 2` to `Community 1`, `Community 14`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `test_each_doc_meets_palette_and_tag_requirements()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `makeService()` connect `Community 5` to `Community 8`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `Development server entry point.  Usage:     python run.py     # or     uvicorn a`, `Connect to MongoDB. Non-fatal if unavailable — endpoints that     require the DB`, `Return the MongoDB database handle.      Raises a clear error if the DB is not c` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._