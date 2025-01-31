/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { IconTerminal2 } from '@tabler/icons';
import { invoke } from '@tauri-apps/api/tauri';
import ErrorBoundary from 'components/misc/ErrorBoundary';
import Tooltip from 'components/misc/Tooltip';
import RawMarkdown from 'components/md/Markdown';
import { getFavicon, isSVG } from 'utils/helper';
import { useStore } from 'lib/store';
import { joinPaths } from 'file/util';
import FileAPI from 'file/files';

type AppMeta = {
  name: string;
  url: string;
  icon?: string;
  domain?: string;
  script?: string;
  disabled?: boolean;
}

type AppEntry = {
  ty: string;
  items: AppMeta[];
}

type WrapEntry = {
  title: string;
  app: AppEntry[];
}

type AppItemProps = {
  ty: string;
  meta: AppMeta;
  disabled?: boolean;
  classname?: string;
}

function AppItem (props: AppItemProps) {
  const { ty, meta, disabled = false, classname = 'lg' } = props;
  const handleWebWindow = async () => {
    if (disabled) return;
    if (!meta.url) return;
    await invoke('web_window', {
      label: Date.now().toString(16),
      title: `${ty} / ${meta.name}`,
      url: meta.url,
      script: meta?.script,
    });
  };

  const itemClass = 
    `flex flex-col items-center justify-center my-2 mx-4 cursor-pointer ${classname}`;

  return (
    <div 
      className={itemClass} 
      onClick={handleWebWindow} 
      title={meta.name}
    >
      {meta?.icon && isSVG(meta?.icon)
        ? <i 
            className="w-16 h-16" 
            dangerouslySetInnerHTML={{ __html: meta.icon }} 
          />
        : <img 
            className="w-16 h-16" 
            src={meta.icon ? meta.icon : getFavicon(meta.domain || meta.url)} 
          /> 
      }
      <div className="text-black dark:text-white">{meta.name}</div>
    </div>
  )
}

export default function Wrap() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [content, setContent] = useState<WrapEntry | null>(null);
  const [wrapConfigPath, setWrapConfigPath] = useState('');
  useEffect(() => {
    if (!isLoaded) {
      invoke("create_mdsilo_dir").then((path) => {
        // console.log("mdsilo dir", path);
        joinPaths((path as string), ["wrap.json"]).then((configPath) => {
          setWrapConfigPath(configPath);
          const jsonFile = new FileAPI(configPath);
          jsonFile.readFile().then(json => {
            if (json.trim()) {
              setContent(JSON.parse(json));
            } else {
              setContent(defaultApps);
            }
          });
        })
      })
    }
    return () => { setIsLoaded(true); };
  }, [isLoaded]);

  const [showAdd, setShowAdd] = useState(false);
  const darkMode = useStore((state) => state.darkMode);

  const onContentChange = useCallback(
    async (text: string) => {
      if (wrapConfigPath) {
        const jsonFile = new FileAPI(wrapConfigPath);
        await jsonFile.writeFile(text);
        setContent(JSON.parse(text));
        setIsLoaded(false);
      }
    },
    [wrapConfigPath]
  );
  
  return (
    <ErrorBoundary>
      <Tooltip content="Config Wrap" placement="bottom">
        <button
          className="p-2 mx-2 mt-1 text-sm text-black rounded bg-purple-100 dark:bg-purple-900 hover:bg-primary-100"
          onClick={() => setShowAdd(!showAdd)}
        >
          <IconTerminal2 size={16} className="" />
        </button>
      </Tooltip>
      {showAdd ? (
        <RawMarkdown
          key="app-json"
          initialContent={JSON.stringify(content)}
          onChange={onContentChange}
          dark={darkMode}
          lang={"json"}
          className={"text-xl m-2"}
        />
      ) : (
        content?.app?.map((group: any, idx: number) => {
          return (
            <div className="p-4 m-4 bg-slate-300 dark:bg-slate-600" key={`${group.ty}_${idx}`}>
              {group.ty && <h3 className="text-black dark:text-white">{group.ty}</h3>}
              <div className="flex flex-wrap p-2">
                {group?.items?.map((app: AppMeta) => (
                  <AppItem
                    key={app.name}
                    ty={group.ty}
                    meta={app}
                    disabled={app.disabled}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </ErrorBoundary>
  )
}


const defaultApps: WrapEntry = {
	"title": "Assistant for mdsilo",
  "app": [
    {
			"ty": "Assistant for mdsilo",
			"items": [
        {
					"name": "ChatGPT",
					"url": "https://chat.openai.com",
          "domain": "https://openai.com", 
					"script": ""
				},
				{
					"name": "WikiPedia",
					"url": "https://www.wikipedia.org/",
					"icon": ""
				}
			]
		},
    {
			"ty": "Bookmark",
			"items": [
        {
					"name": "PlayGround",
					"url": "https://play.rust-lang.org/",
          "domain": "https://rust-lang.org/", 
					"icon": "https://www.rust-lang.org/static/images/rust-logo-blk.svg"
				},
				{
					"name": "Crates",
					"url": "https://crates.io/",
					"icon": ""
				},
        {
					"name": "Docs",
					"url": "https://docs.rs/",
					"icon": ""
				}
			]
		}
	]
};
