import { useMemo, useCallback, useRef, useState } from 'react';
import { 
  IconMenu2, IconDna, IconBookmarks, IconCheckbox, IconFile,
  IconFolderPlus, IconFileText, IconFileUpload, IconDeviceFloppy 
} from '@tabler/icons';
import { Menu } from '@headlessui/react';
import { usePopper } from 'react-popper';
import { useCurrentViewContext } from 'context/useCurrentView';
import useHotkeys from 'editor/hooks/useHotkeys';
import { onImportJson, onOpenFile, onOpenDir, onSave } from 'editor/hooks/useOpen';
import { useStore } from 'lib/store';
import { DropdownItem } from 'components/misc/Dropdown';
import Tooltip from 'components/misc/Tooltip';
import Portal from 'components/misc/Portal';
import SidebarItem from './SidebarItem';
import Logo from '../Logo';

export default function SideMenu() {
  const currentView = useCurrentViewContext();
  const viewTy = currentView.state.view;
  const dispatch = currentView.dispatch;
  const dispatchChron = useCallback(
    () => dispatch({view: 'chronicle'}), [dispatch]
  );
  const dispatchTask = useCallback(
    () => dispatch({view: 'task'}), [dispatch]
  );
  const dispatchGraph = useCallback(
    () => dispatch({view: 'graph'}), [dispatch]
  );

  const hotkeys = useMemo(
    () => [
      {
        hotkey: 'mod+shift+g',
        callback: dispatchGraph,
      },
      {
        hotkey: 'mod+shift+c',
        callback: dispatchChron,
      },
      {
        hotkey: 'mod+shift+t',
        callback: dispatchTask,
      },
    ],
    [dispatchGraph, dispatchChron, dispatchTask]
  );
  useHotkeys(hotkeys);

  return (    
    <div className="flex flex-col h-full">
      <Logo />
      <OpenButton />
      <ChronButton 
        viewTy={viewTy} 
        onDispatch={dispatchChron} 
      />
      <GraphButton 
        viewTy={viewTy} 
        onDispatch={dispatchGraph} 
      />
      <TaskButton 
        viewTy={viewTy} 
        onDispatch={dispatchTask} 
      />
      <FileButton />
    </div>
  );
}

const btnClass = 'title flex items-center text-lg p-2';
const btnIconClass = 'flex-shrink-0 mx-1 text-gray-600 dark:text-gray-400';

const OpenButton = () => {
  const setIsSidebarOpen = useStore((state) => state.setIsSidebarOpen);
  const isSidebarOpen: boolean = useStore((state) => state.isSidebarOpen);

  return (
    <SidebarItem isHighlighted={isSidebarOpen}>
      <Tooltip content="Toggle Sidebar (Alt+X)" placement="right">
        <button
          aria-label="Toggle Sidebar"
          className={btnClass}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <IconMenu2 size={24} className={btnIconClass} />
        </button>
      </Tooltip>
    </SidebarItem>
  );
}

type ButtonProps = {
  viewTy: string;
  onClick?: () => void;
  onDispatch: () => void;
};

const GraphButton = (props: ButtonProps) => {
  const { viewTy, onClick, onDispatch } = props;

  return (
    <SidebarItem isHighlighted={viewTy === 'graph'} onClick={onClick}>
      <Tooltip
        content="Visualization of networked writing (Ctrl+Shift+G)"
        placement="right"
        touch={true}
      >
        <button className={btnClass} onClick={onDispatch}>
          <IconDna size={24} className={btnIconClass} />
        </button>
      </Tooltip>
    </SidebarItem>
  );
};

const ChronButton = (props: ButtonProps) => {
  const { viewTy, onClick, onDispatch } = props;

  return (
    <SidebarItem isHighlighted={viewTy === 'chronicle'} onClick={onClick}>
      <Tooltip
        content="Chronicle View (Ctrl+Shift+C)"
        placement="right"
        touch={true}
      >
        <button className={btnClass} onClick={onDispatch}>
          <IconBookmarks size={24} className={btnIconClass} />
        </button>
      </Tooltip>
    </SidebarItem>
  );
};

const TaskButton = (props: ButtonProps) => {
  const { viewTy, onClick, onDispatch } = props;

  return (
    <SidebarItem isHighlighted={viewTy === 'task'} onClick={onClick}>
      <Tooltip
        content="Track Personal Tasks (Ctrl+Shift+T)"
        placement="right"
        touch={true}
      >
        <button className={btnClass} onClick={onDispatch}>
          <IconCheckbox size={24} className={btnIconClass} />
        </button>
      </Tooltip>
    </SidebarItem>
  );
};

type FileDropProps = {
  className?: string;
};

export function FileDrop(props: FileDropProps) {
  return (
    <>
      <DropdownItem 
        onClick={onSave} 
        className="border-b-2 border-gray-200 dark:border-gray-600"
      >
        <IconDeviceFloppy size={18} className="mr-1" />
        <Tooltip content="Save All Data"><span>Save</span></Tooltip>
      </DropdownItem>
      <DropdownItem onClick={onOpenDir}>
        <IconFolderPlus size={18} className="mr-1" />
        <Tooltip content="Open Folder"><span>Folder</span></Tooltip>
      </DropdownItem>
      <DropdownItem onClick={onOpenFile}>
        <IconFileText size={18} className="mr-1" />
        <Tooltip content="Open .md"><span>Text</span></Tooltip>
      </DropdownItem>
      <DropdownItem onClick={onImportJson}>
        <IconFileUpload size={18} className="mr-1" />
        <Tooltip content="Import JSON"><span>JSON</span></Tooltip>
      </DropdownItem>
    </>  
  );
}

const FileButton = () => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = 
    useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(
    btnRef.current, popperElement, { placement: 'right-start' }
  );

  return (
    <Menu>
      {({ open }) => (
        <>
          <Menu.Button ref={btnRef} className="hover:bg-gray-200 dark:hover:bg-gray-700">
            <Tooltip content="File Menu" placement="right" touch={true}>
              <span className={btnClass}>
                <IconFile size={24} className={btnIconClass} />
              </span>
            </Tooltip>
          </Menu.Button>
          {open && (
            <Portal>
              <Menu.Items
                ref={setPopperElement}
                className="z-20 w-42 overflow-hidden bg-white rounded shadow-popover dark:bg-gray-800 focus:outline-none"
                static
                style={styles.popper}
                {...attributes.popper}
              >
                <FileDrop />
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
};
