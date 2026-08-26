
// 使用中文索引
asbm.markdown.index = '索引.md';

// 应用 marked-katex-extension 扩展
marked.use(markedKatex({
  throwOnError: asbm.silent
}));

// 图片锚点支持 lucide svg sprite
marked.use({
  renderer: {
    image({ href, title, text }) {
      if (href.startsWith('#')) {
        return `
<span class="${title || ''}">
  <svg><use xlink:href="index/lucide.svg${href}"></use></svg>
  ${text || ''}
</span>`;
      }
      else return false;
    }
  }
});

// 应用 marked-highlight 扩展
marked.use(
  markedHighlight.markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);


// asbm.breadcrumb.home = '<svg><use xlink:href="index/lucide.svg#house"></use></svg>';

// 主页面批量刷新
asbm.safeAdd('html.refrech', function (main) {
  this.write('b-content', main.html);
  this.write('b-toc', asbm.toc.render());

  this.write('b-header', asbm.breadcrumb.render(),
    '<section class="section breadcrumb">{html}</section>');

  // 显示错误记录
  if (asbm.errors.length > 0 && !asbm.silent) {
    this.write('b-header', asbm.errors.map(error => `<p>${error}</p>`).join(''),
      '<section class="section error">{html}</section>', -1);

    // 清空错误记录，为下次页面刷新做准备
    asbm.errors = [];
  }
  else {
    // 不出错或不显示才跳转到锚点
    this.scroll(asbm.meta.hash);
  }
});

// 加载区块。要在主页面之前完成，避免区块错误不显示
asbm.loadBlock('index/_side.md')
  .then(block => {
    asbm.html.write('b-side', block.html);
  });

// 使用当前网址的 search 和 hash 字符串作为主页面
asbm.loadMain(location.search + location.hash)
  .then(main => {
    asbm.html.refrech(main);

    const title = asbm.html.title();
    document.title = title;
    history.replaceState(asbm.meta.state, title, asbm.meta.link);
  });


// 使用事件委托监听所有点击事件
document.addEventListener('click', function(event) {
  // 检查点击的元素是否有 data-target 和 data-class 属性
  // 用 closest 是因为也许点击的是按钮内包含的子元素
  const btn = event.target.closest('[data-target][data-class]');
  if (btn) {
    // 获取目标选择器 data-target，类名 data-class，修改方法 data-action
    const selector = btn.dataset.target;
    const className = btn.dataset.class;
    const action = btn.dataset.action

    // 对选择器找到的每个元素执行操作
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      switch(action) {
        case 'add':
          element.classList.add(className);
          break;
        case 'remove':
        case 'unique':
          element.classList.remove(className);
          break;
        default: // case toggle':
          element.classList.toggle(className);
      }
    });

    if (action === 'unique') {
      const btnOnly = event.target.closest(selector);
      if (btnOnly) btnOnly.classList.add(className);
    }
  }

  const a = event.target.closest('a');
  const link = a ? a.getAttribute('href') : '';
  if (link) {
    if (link.startsWith('?')) {
      event.preventDefault();

      asbm.loadMain(link)
        .then(main => {
          asbm.html.refrech(main);

          const title = asbm.html.title();
          document.title = title;
          history.pushState(asbm.meta.state, title, link);
        });
    }

    if (link.startsWith('#')) {
      event.preventDefault();

      asbm.meta.link = asbm.meta.hash = decodeURI(link);
      history.pushState(asbm.meta.state, '', link);

      asbm.html.scroll(asbm.meta.hash);
    }
  }

});

window.addEventListener('popstate', (event) => {
  // 如果不使用原始网址，则可能 link 是不规范网址，而 file 转为 badlink 导致错误消失
  let link = event.state.link;

  // 需要还原点击锚点时的网址
  if (link.startsWith('#')) {
    link = '?' + event.state.path + event.state.file + event.state.hash;
  }

  asbm.loadMain(link)
    .then(main => {
      asbm.html.refrech(main);

      const title = asbm.html.title();
      document.title = title;
    });
});
