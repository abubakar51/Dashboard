// const defaultURLs = [
//   'https://www.youtube.com/watch?v=iEpJwprxDdk',
//   'https://tradingeconomics.com/commodity/cotton',
//   'https://futures.tradingcharts.com/futures/quotes/ct.html',
//   'https://www.google.com/finance/quote/USD-BDT?sa=X&ved=2ahUKEwjnvJXGneOMAxUqxTgGHZ4SKtkQmY0JegQIChAv'
// ];

// script.js file to be linked in index.html




let activeWebview = null;
const zoomBackup = new Map(); // <-- Zoom backup per webview

// defaultURLs.forEach((url, index) => createTab(index, url));
let defaultURLs = [];

async function getLinksFromServer() {
  try {
    const res = await fetch('http://localhost:3000/links');
    const links = await res.json();
    return links;
  } catch (err) {
    console.error('Failed to fetch links:', err);
    return [];
  }
}

window.onload = async () => {
  defaultURLs = await getLinksFromServer();

  // Ekhane defaultURLs theke tab create korba
  defaultURLs.forEach((index, url) => {
    createTab(url, index); // tumi jei function use koro webview create korar jonno
  });
};
function createTab(i, defaultURL) {
  const tabContainer = document.getElementById('tabContainer');
  const tab = document.createElement('div');
  tab.className = 'tab';
  const controls = document.createElement('div');
  controls.className = 'controls';

  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group input-group-sm';
  inputGroup.style.flex = '1';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'input-group-text';
  iconSpan.style.display = 'flex';
  iconSpan.style.alignItems = 'center';
  iconSpan.style.justifyContent = 'center';
  iconSpan.style.padding = '0 0.5rem';
  iconSpan.style.height = '100%';
  iconSpan.style.boxSizing = 'border-box';

  const iconImg = document.createElement('img');
  iconImg.style.width = '20px';
  iconImg.style.height = '20px';
  iconImg.style.display = 'none';

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.style.width = '16px';
  spinner.style.height = '16px';
  spinner.style.minWidth = '16px';
  spinner.style.minHeight = '16px';
  spinner.style.border = '2px solid #ccc';
  spinner.style.borderTop = '2px solid #333';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';

  iconSpan.appendChild(spinner);
  iconSpan.appendChild(iconImg);
  inputGroup.append(iconSpan);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.id = `url${i}`;
  input.value = defaultURL;
  input.addEventListener('focus', () => input.select());
  inputGroup.appendChild(input);

  const backBtn = document.createElement('button');
  backBtn.innerHTML = '<i class="bi bi-arrow-left"></i>';

  const homeBtn = document.createElement('button');
  homeBtn.innerHTML = '<i class="bi bi-house"></i>';

  const fullBtn = document.createElement('button');
  fullBtn.innerHTML = '<i class="bi bi-fullscreen"></i>';

  controls.append(inputGroup, backBtn, homeBtn, fullBtn);

  const webview = document.createElement('webview');
  webview.setAttribute('allowpopups', '');
  webview.setAttribute('webpreferences', 'nativeWindowOpen=yes');
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  webview.src = defaultURL;

  const updateFavicon = (url) => {
    try {
      iconImg.src = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=116`;
    } catch {}
  };

  updateFavicon(defaultURL);

  const loadURL = (inputValue) => {
    let raw = inputValue.trim();
    let url;
    const isLikelyURL = raw.includes('.') && !raw.includes(' ');

    if (isLikelyURL) {
      if (!raw.startsWith('http')) raw = 'https://' + raw;
      url = raw;
    } else {
      url = `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
    }

    webview.src = url;
    input.value = url;
    updateFavicon(url);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadURL(input.value);
  });

  backBtn.onclick = () => {
    if (webview.canGoBack()) {
      webview.goBack();
    }
  };

  homeBtn.onclick = () => {
    input.value = defaultURL;
    loadURL(defaultURL);
  };

  fullBtn.onclick = async () => {
    const isFull = tab.classList.toggle('fullscreen');
    fullBtn.innerHTML = isFull
      ? '<i class="bi bi-fullscreen-exit"></i>'
      : '<i class="bi bi-arrows-fullscreen"></i>';

    if (isFull) {
      // Save current zoom before fullscreen
      const zoom = await webview.getZoomFactor();
      zoomBackup.set(webview, zoom);
      webview.setZoomFactor(1.0); // Set to 100%
    } else {
      // Restore previous zoom
      const oldZoom = zoomBackup.get(webview);
      if (oldZoom !== undefined) {
        webview.setZoomFactor(oldZoom);
        zoomBackup.delete(webview);
      }
    }
  };

  const updateURL = (e) => {
    input.value = e.url;
    updateFavicon(e.url);
  };

  webview.addEventListener('did-navigate', updateURL);
  webview.addEventListener('did-navigate-in-page', updateURL);
  webview.addEventListener('did-start-loading', () => {
    spinner.style.display = 'block';
    iconImg.style.display = 'none';
  });

  webview.addEventListener('did-stop-loading', () => {
    spinner.style.display = 'none';
    iconImg.style.display = 'block';

    webview.executeJavaScript(`
      (() => {
        try {
          const style = document.createElement('style');
          style.innerHTML = \`
            .simulate-fullscreen {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              z-index: 9999 !important;
              background: #fff !important;
            }
    
            .simulate-fullscreen-exit-btn {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 10000 !important;
              padding: 6px 12px;
              background: #000;
              color: #fff;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
            }
          \`;
          document.head.appendChild(style);
    
          const attachFullscreenHandler = () => {
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            const chartElem = document.getElementById('trading_chart');
    
            if (fullscreenBtn && chartElem && !fullscreenBtn.dataset.bound) {
              fullscreenBtn.dataset.bound = 'true';
    
              fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
    
                // Remove native fullscreen if triggered
                (document.exitFullscreen || document.webkitExitFullscreen || (() => {}))();
    
                // Remove old exit button if exists
                const oldExit = document.querySelector('.simulate-fullscreen-exit-btn');
                if (oldExit) oldExit.remove();
    
                chartElem.classList.add('simulate-fullscreen');
    
                const exitBtn = document.createElement('button');
                exitBtn.innerText = 'Exit Fullscreen';
                exitBtn.className = 'simulate-fullscreen-exit-btn';
                exitBtn.onclick = () => {
                  chartElem.classList.remove('simulate-fullscreen');
                  exitBtn.remove();
                };
    
                chartElem.appendChild(exitBtn);
              });
            }
          };
    
          // Initial attempt
          attachFullscreenHandler();
    
          // Keep watching the page for DOM changes
          const observer = new MutationObserver(() => {
            attachFullscreenHandler();
          });
    
          observer.observe(tabContainer, {
            childList: true,
            subtree: true
          });
    
        } catch (err) {
          console.error('Fullscreen simulation setup error:', err);
        }
      })();
    `).catch(err => console.error('Inject error:', err));
    
    if (location.hostname.includes('youtube.com') && location.href.includes('watch')) {
          setTimeout(() => {
            const tKeyEvent = new KeyboardEvent('keydown', {
              key: 't',
              code: 'KeyT',
              keyCode: 84,
              which: 84,
              bubbles: true,
              cancelable: true
            });
            document.dispatchEvent(tKeyEvent);
          }, 2000);
        }
  });

  webview.addEventListener('new-window', (e) => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(e.url);
    }
  });

  let zoomFactor = 1.0;

  webview.addEventListener('focus', () => {
    activeWebview = webview;
  });

  webview.addEventListener('click', () => {
    activeWebview = webview;
  });

  webview.__zoomFactor = zoomFactor;

  tab.append(controls, webview);
  tabContainer.appendChild(tab);

  if (!document.getElementById('spinner-style')) {
    const spinnerStyle = document.createElement('style');
    spinnerStyle.id = 'spinner-style';
    spinnerStyle.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(spinnerStyle);
  }
  
}
async function reloadTabs() {
  const tabContainer = document.getElementById('tabContainer');

  // পুরনো সব tab/webview clear করে দাও
  tabContainer.innerHTML = '';

  // আবার server থেকে defaultURLs fetch করো
  defaultURLs = await getLinksFromServer();

  // নতুন করে recreate করো tabs
  defaultURLs.forEach((url, index) => {
    createTab(index, url);
  });
}
// Global Zoom Controls for Active Tab Only
window.addEventListener('keydown', (e) => {
  if (!activeWebview) return;

  if (e.ctrlKey && e.key === 'i') {
    activeWebview.__zoomFactor = Math.min((activeWebview.__zoomFactor || 1.0) + 0.01, 3);
    activeWebview.setZoomFactor(activeWebview.__zoomFactor);
  }

  if (e.ctrlKey && e.key === 'o') {
    activeWebview.__zoomFactor = Math.max((activeWebview.__zoomFactor || 1.0) - 0.01, 0.25);
    activeWebview.setZoomFactor(activeWebview.__zoomFactor);
  }

  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.style.display = 'none';
    });

    const overlay = document.getElementById('loveOverlay');
    if (overlay) overlay.style.display = 'block';
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    }
  }
});
const { ipcRenderer } = require('electron');

document.getElementById('settingsBtn').addEventListener('click', () => {
  const hostURL = 'http://localhost:3000';
  ipcRenderer.send('open-localhost', hostURL);
});
document.getElementById('minBtn').addEventListener('click', () => {
  ipcRenderer.send('minimize-window');
});
document.getElementById('maxBtn').addEventListener('click', () => {
  ipcRenderer.send('maximize-window');
});
document.getElementById('closeBtn').addEventListener('click', () => {
  ipcRenderer.send('close-window');
});

document.getElementById('reloadBtn').addEventListener('click', () => {
  reloadTabs();
});







document.addEventListener('DOMContentLoaded', function() {
    // Get the body element
    const body = document.body;
    
    // Clear all existing content in the body
    body.innerHTML = '';
  tabContainer.innerHTML = '';
    
    // Create a new div element
    const div = document.createElement('div');
    
    // Set the div's styles
    div.style.position = 'absolute';
    div.style.width = '100%';
    div.style.height = '100%';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';
    div.style.backgroundColor = '#fff'; // white background
    
    // Create a heading element
    const heading = document.createElement('h1');
    heading.textContent = 'I Love You';
    heading.style.fontSize = '5rem';
    heading.style.color = '#ff0000'; // red color
    heading.style.textAlign = 'center';
    
    // Append the heading to the div
    div.appendChild(heading);
    
    // Append the div to the body
    tabContainer.appendChild(div);
});
