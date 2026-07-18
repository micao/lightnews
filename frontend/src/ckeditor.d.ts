declare module '@ckeditor/ckeditor5-react' {
    import * as React from 'react';
    export class CKEditor extends React.Component<any, any> {}
}

declare module '@ckeditor/ckeditor5-build-classic' {
    const ClassicEditor: any;
    export default ClassicEditor;
}
