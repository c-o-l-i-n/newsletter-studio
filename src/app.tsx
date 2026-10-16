import { CropDialogHost } from './components/crop-dialog';
import { EditorView } from './views/editor';

export default function App() {
  return (
    <>
      <EditorView />
      <CropDialogHost />
    </>
  );
}
