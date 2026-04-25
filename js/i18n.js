const I18N = {
  en: {
    editor: 'Editor', preview: 'Preview', cancel: 'Cancel', insert: 'Insert',
    linkTitle: 'Insert Link', linkText: 'Text', linkUrl: 'URL',
    imageTitle: 'Insert Image', imageAlt: 'Alt Text', imageUrl: 'Image URL',
    uploadImage: 'Upload local image', or: 'or',
    videoTitle: 'Embed Video', videoUrl: 'Video URL (YouTube, Vimeo, etc.)',
    emojiSearch: 'Search emoji...',
    words: 'words', chars: 'chars',
    exported: 'Exported!', newDoc: 'New document created',
    fileLoaded: 'File loaded'
  },
  id: {
    editor: 'Editor', preview: 'Pratinjau', cancel: 'Batal', insert: 'Sisipkan',
    linkTitle: 'Sisipkan Tautan', linkText: 'Teks', linkUrl: 'URL',
    imageTitle: 'Sisipkan Gambar', imageAlt: 'Teks Alt', imageUrl: 'URL Gambar',
    uploadImage: 'Unggah gambar lokal', or: 'atau',
    videoTitle: 'Sematkan Video', videoUrl: 'URL Video (YouTube, Vimeo, dll.)',
    emojiSearch: 'Cari emoji...',
    words: 'kata', chars: 'karakter',
    exported: 'Terekspor!', newDoc: 'Dokumen baru dibuat',
    fileLoaded: 'Berkas dimuat'
  },
  ja: {
    editor: 'エディタ', preview: 'プレビュー', cancel: 'キャンセル', insert: '挿入',
    linkTitle: 'リンクを挿入', linkText: 'テキスト', linkUrl: 'URL',
    imageTitle: '画像を挿入', imageAlt: '代替テキスト', imageUrl: '画像URL',
    uploadImage: '画像をアップロード', or: 'または',
    videoTitle: '動画を埋め込み', videoUrl: '動画URL（YouTube、Vimeoなど）',
    emojiSearch: '絵文字を検索...',
    words: '単語', chars: '文字',
    exported: 'エクスポート完了！', newDoc: '新しいドキュメントを作成しました',
    fileLoaded: 'ファイルを読み込みました'
  },
  ko: {
    editor: '에디터', preview: '미리보기', cancel: '취소', insert: '삽입',
    linkTitle: '링크 삽입', linkText: '텍스트', linkUrl: 'URL',
    imageTitle: '이미지 삽입', imageAlt: '대체 텍스트', imageUrl: '이미지 URL',
    uploadImage: '로컬 이미지 업로드', or: '또는',
    videoTitle: '비디오 삽입', videoUrl: '비디오 URL (YouTube, Vimeo 등)',
    emojiSearch: '이모지 검색...',
    words: '단어', chars: '문자',
    exported: '내보내기 완료!', newDoc: '새 문서를 만들었습니다',
    fileLoaded: '파일을 불렀습니다'
  }
};

let currentLang = localStorage.getItem('mdlive-lang') || 'en';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('mdlive-lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  const emojiSearch = document.getElementById('emojiSearch');
  if (emojiSearch) emojiSearch.placeholder = t('emojiSearch');
}

function updateWordCount() {
  const text = document.getElementById('editor').value;
  const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
  const cc = text.length;
  document.getElementById('wordCount').textContent =
    `${wc} ${t('words')} · ${cc} ${t('chars')}`;
}
