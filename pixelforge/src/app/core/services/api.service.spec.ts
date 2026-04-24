import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

/**
 * Vitest suite for {@link ApiService}.
 *
 * Scope (per story PX-001 AC-3):
 * - Covers all public HTTP verbs.
 * - Asserts URL construction and query-string encoding.
 * - Exercises `catchError` fallback paths on 4xx/5xx.
 *
 * HTTP layer is mocked via `provideHttpClientTesting()` — no real network.
 */
describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- Image Processing ---

  it('removeBackground POSTs multipart/form-data', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.removeBackground(file).subscribe();

    const req = httpMock.expectOne(`${base}/api/remove-background`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['result']));
  });

  it('healthCheck returns status/database object', () => {
    let result: any;
    service.healthCheck().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/api/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok', database: 'up' });
    expect(result).toEqual({ status: 'ok', database: 'up' });
  });

  // --- Projects ---

  it('createProject POSTs to /api/projects', () => {
    const data = { name: 'P', width: 100, height: 100 };
    service.createProject(data).subscribe();
    const req = httpMock.expectOne(`${base}/api/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({ id: '1', ...data, created_at: '', updated_at: '' });
  });

  it('listProjects returns [] on server error (catchError fallback)', () => {
    let result: any;
    service.listProjects().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/api/projects`);
    req.flush('boom', { status: 500, statusText: 'Internal Server Error' });
    expect(result).toEqual([]);
  });

  it('listProjects emits array on success', () => {
    let result: any;
    service.listProjects().subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/projects`);
    req.flush([{ id: '1', name: 'p', width: 1, height: 1, created_at: '', updated_at: '' }]);
    expect(result.length).toBe(1);
  });

  it('getProject GETs by id', () => {
    service.getProject('abc').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/abc`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'abc', name: 'x', width: 0, height: 0, created_at: '', updated_at: '' });
  });

  it('updateProject PUTs partial data', () => {
    service.updateProject('1', { name: 'newname' }).subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'newname' });
    req.flush({ id: '1', name: 'newname', width: 1, height: 1, created_at: '', updated_at: '' });
  });

  it('deleteProject DELETEs by id', () => {
    service.deleteProject('1').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  // --- Sharing ---

  it('createShareLink POSTs to share endpoint', () => {
    service.createShareLink('42').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/42/share`);
    expect(req.request.method).toBe('POST');
    req.flush({ share_token: 'tok', project_id: '42' });
  });

  it('revokeShareLink DELETEs share endpoint', () => {
    service.revokeShareLink('42').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/42/share`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('getSharedProject GETs by token', () => {
    service.getSharedProject('tok-xyz').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/shared/tok-xyz`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: '1', name: 'x', width: 0, height: 0, created_at: '', updated_at: '' });
  });

  // --- Versions ---

  it('listVersions GETs versions list', () => {
    service.listVersions('proj').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/proj/versions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createVersion with note appends encoded querystring', () => {
    service.createVersion('proj', 'hello world').subscribe();
    const req = httpMock.expectOne(
      `${base}/api/projects/proj/versions?note=${encodeURIComponent('hello world')}`,
    );
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('createVersion without note omits query', () => {
    service.createVersion('proj').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/proj/versions`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('restoreVersion POSTs to restore endpoint', () => {
    service.restoreVersion('p', 'v').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/p/versions/v/restore`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  // --- Assets ---

  it('uploadAsset without projectId omits query', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.uploadAsset(file).subscribe();
    const req = httpMock.expectOne(`${base}/api/assets/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({});
  });

  it('uploadAsset with projectId appends it', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.uploadAsset(file, 'proj').subscribe();
    const req = httpMock.expectOne(`${base}/api/assets/upload?project_id=proj`);
    req.flush({});
  });

  it('listAssets without projectId omits query', () => {
    service.listAssets().subscribe();
    const req = httpMock.expectOne(`${base}/api/assets`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listAssets with projectId appends query', () => {
    service.listAssets('proj').subscribe();
    const req = httpMock.expectOne(`${base}/api/assets?project_id=proj`);
    req.flush([]);
  });

  it('listAssets returns [] on 4xx error (catchError fallback)', () => {
    let result: any;
    service.listAssets().subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/assets`);
    req.flush('nope', { status: 404, statusText: 'Not Found' });
    expect(result).toEqual([]);
  });

  it('deleteAsset DELETEs by id', () => {
    service.deleteAsset('id').subscribe();
    const req = httpMock.expectOne(`${base}/api/assets/id`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('getAssetUrl composes URL synchronously (no HTTP)', () => {
    expect(service.getAssetUrl('abc')).toBe(`${base}/api/assets/abc`);
  });

  // --- Brand Kit ---

  it('getBrandKit returns empty shape on server error', () => {
    let result: any;
    service.getBrandKit().subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/brand-kit`);
    req.flush('err', { status: 500, statusText: 'Server Error' });
    expect(result).toEqual({ colors: [], fonts: [], logos: [] });
  });

  it('getBrandKit returns server payload on success', () => {
    let result: any;
    service.getBrandKit().subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/brand-kit`);
    req.flush({ colors: ['#000'], fonts: ['Roboto'], logos: [] });
    expect(result.colors).toEqual(['#000']);
  });

  it('saveBrandKit PUTs payload', () => {
    service.saveBrandKit({ colors: [], fonts: [], logos: [] }).subscribe();
    const req = httpMock.expectOne(`${base}/api/brand-kit`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  // --- Comments ---

  it('listComments returns [] on error', () => {
    let result: any;
    service.listComments('p').subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/projects/p/comments`);
    req.flush('', { status: 500, statusText: 'X' });
    expect(result).toEqual([]);
  });

  it('createComment POSTs payload', () => {
    service.createComment('p', { x: 1, y: 2, text: 't', author: 'a' }).subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/p/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ x: 1, y: 2, text: 't', author: 'a' });
    req.flush({});
  });

  it('updateComment PATCHes payload', () => {
    service.updateComment('p', 'c', { resolved: true }).subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/p/comments/c`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ resolved: true });
    req.flush({});
  });

  it('deleteCommentRemote DELETEs by ids', () => {
    service.deleteCommentRemote('p', 'c').subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/p/comments/c`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('addReply POSTs reply payload', () => {
    service.addReply('p', 'c', { text: 'hi' }).subscribe();
    const req = httpMock.expectOne(`${base}/api/projects/p/comments/c/replies`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  // --- Public Templates ---

  it('listPublicTemplates with no filters hits base endpoint', () => {
    service.listPublicTemplates().subscribe();
    const req = httpMock.expectOne(`${base}/api/public-templates`);
    req.flush([]);
  });

  it('listPublicTemplates ignores category="all"', () => {
    service.listPublicTemplates('all').subscribe();
    const req = httpMock.expectOne(`${base}/api/public-templates`);
    req.flush([]);
  });

  it('listPublicTemplates encodes category + search', () => {
    service.listPublicTemplates('Logo', 'hello world').subscribe();
    const expected =
      `${base}/api/public-templates?category=Logo&search=${encodeURIComponent('hello world')}`;
    const req = httpMock.expectOne(expected);
    req.flush([]);
  });

  it('listPublicTemplates returns [] on error', () => {
    let result: any;
    service.listPublicTemplates().subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/public-templates`);
    req.flush('', { status: 503, statusText: 'X' });
    expect(result).toEqual([]);
  });

  it('getPublicTemplate GETs by id', () => {
    service.getPublicTemplate('id').subscribe();
    const req = httpMock.expectOne(`${base}/api/public-templates/id`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('publishTemplate POSTs payload', () => {
    service.publishTemplate({
      name: 'n',
      category: 'Logo',
      canvas_json: '{}',
      width: 1,
      height: 1,
    }).subscribe();
    const req = httpMock.expectOne(`${base}/api/public-templates`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('n');
    req.flush({});
  });

  // --- Seed Templates (PX-022a / PX-023) ---

  it('listTemplates GETs /api/v1/templates with platform', () => {
    service.listTemplates('ig-post').subscribe();
    const req = httpMock.expectOne(`${base}/api/v1/templates?platform=ig-post`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listTemplates encodes comma-separated tags', () => {
    service.listTemplates('ig-post', ['Bold', 'Festive']).subscribe();
    const expected = `${base}/api/v1/templates?platform=ig-post&tags=${encodeURIComponent('Bold,Festive')}`;
    const req = httpMock.expectOne(expected);
    req.flush([]);
  });

  it('listTemplates omits tags when array is empty', () => {
    service.listTemplates('yt-thumb', []).subscribe();
    const req = httpMock.expectOne(`${base}/api/v1/templates?platform=yt-thumb`);
    req.flush([]);
  });

  it('listTemplates returns [] on error (catchError fallback)', () => {
    let result: any;
    service.listTemplates('ig-story').subscribe(r => (result = r));
    const req = httpMock.expectOne(`${base}/api/v1/templates?platform=ig-story`);
    req.flush('', { status: 500, statusText: 'X' });
    expect(result).toEqual([]);
  });

  it('createProjectFromTemplate POSTs to /api/projects with preset dims + stringified canvas', () => {
    const canvas = { version: '7.0.0', objects: [{ type: 'rect' }] };
    service
      .createProjectFromTemplate({
        source_template_id: 't1',
        canvas_json: canvas,
        platform: 'ig-post',
        thumbnail_data_url: 'data:image/png;base64,AAA',
        name: 'My Tpl',
      })
      .subscribe();

    const req = httpMock.expectOne(`${base}/api/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('My Tpl');
    expect(req.request.body.width).toBe(1080);
    expect(req.request.body.height).toBe(1080);
    expect(req.request.body.thumbnail).toBe('data:image/png;base64,AAA');
    expect(JSON.parse(req.request.body.canvas_json)).toEqual(canvas);
    req.flush({
      id: 'p1',
      name: 'My Tpl',
      width: 1080,
      height: 1080,
      created_at: '',
      updated_at: '',
    });
  });

  it('createProjectFromTemplate maps yt-thumb to 1280×720', () => {
    service
      .createProjectFromTemplate({
        source_template_id: 't2',
        canvas_json: {},
        platform: 'yt-thumb',
        thumbnail_data_url: 'data:image/png;base64,AAA',
      })
      .subscribe();
    const req = httpMock.expectOne(`${base}/api/projects`);
    expect(req.request.body.width).toBe(1280);
    expect(req.request.body.height).toBe(720);
    expect(req.request.body.name).toBe('Untitled');
    req.flush({
      id: 'p2',
      name: 'Untitled',
      width: 1280,
      height: 720,
      created_at: '',
      updated_at: '',
    });
  });
});
