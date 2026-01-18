
/**
 * Service for Google Drive integration.
 * Requires GAPI and GIS (Google Identity Services) scripts to be loaded.
 */

const CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com"; // Placeholder
const API_KEY = process.env.API_KEY; // Using same key as Gemini if enabled for Drive
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

let tokenClient: any;
let accessToken: string | null = null;

export const initGoogleDrive = () => {
  return new Promise<void>((resolve) => {
    (window as any).gapi.load('client:picker', async () => {
      await (window as any).gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error !== undefined) throw (resp);
          accessToken = resp.access_token;
        },
      });
      resolve();
    });
  });
};

export const openDrivePicker = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!accessToken) {
      tokenClient.callback = (resp: any) => {
        accessToken = resp.access_token;
        createPicker(resolve);
      };
      tokenClient.requestAccessToken();
    } else {
      createPicker(resolve);
    }
  });
};

const createPicker = (resolve: (val: string | null) => void) => {
  const view = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.DOCS)
    .setMimeTypes('application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
  const picker = new (window as any).google.picker.PickerBuilder()
    .enableFeature((window as any).google.picker.Feature.NAV_HIDDEN)
    .enableFeature((window as any).google.picker.Feature.MULTISELECT_ENABLED)
    .setAppId(CLIENT_ID)
    .setOAuthToken(accessToken)
    .addView(view)
    .setCallback(async (data: any) => {
      if (data.action === (window as any).google.picker.Action.PICKED) {
        const doc = data.docs[0];
        const fileId = doc.id;
        // Fetch content
        const response = await (window as any).gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media',
        });
        resolve(response.body);
      } else if (data.action === (window as any).google.picker.Action.CANCEL) {
        resolve(null);
      }
    })
    .build();
  picker.setVisible(true);
};

export const saveToDrive = async (filename: string, content: string | Blob) => {
  if (!accessToken) {
    tokenClient.callback = () => saveToDrive(filename, content);
    tokenClient.requestAccessToken();
    return;
  }

  const fileMetadata = {
    name: filename,
    mimeType: content instanceof Blob ? content.type : 'text/plain',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
  form.append('file', content instanceof Blob ? content : new Blob([content], { type: 'text/plain' }));

  await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
};
