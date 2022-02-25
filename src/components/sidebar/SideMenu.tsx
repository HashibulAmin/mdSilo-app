import { memo, useRef, useState } from 'react';
import { IconMenu2, IconDna, IconBookmarks, IconCheckbox, IconFile } from '@tabler/icons';
import { Menu } from '@headlessui/react';
import { usePopper } from 'react-popper';
import { useCurrentViewContext } from 'context/useCurrentView';
import { store } from 'lib/store';
import Tooltip from 'components/misc/Tooltip';
import Portal from 'components/misc/Portal';
import SidebarItem from './SidebarItem';
import { FileDrop } from './SidebarNotesBar';

export default function SideMenu() {
  const currentView = useCurrentViewContext();
  const viewTy = currentView.state.view;
  const dispatch = currentView.dispatch;
  const dispatchChron = () => dispatch({view: 'chronicle'});
  const dispatchTask = () => dispatch({view: 'task'});
  const dispatchGraph = () => dispatch({view: 'graph'});

  return (    
    <div className="flex flex-col h-full">
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
  const setIsSidebarOpen = store.getState().setIsSidebarOpen;
  //const isSidebarOpen: boolean = store.getState().isSidebarOpen;

  return (
    <SidebarItem>
      <Tooltip content="Open sidebar (Alt+X)" placement="right">
        <button
          aria-label="Open sidebar"
          className={btnClass}
          onClick={() => setIsSidebarOpen(true)}
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


const SideMenuFIleDropdown = () => {
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
          <Menu.Button ref={btnRef} className={btnClass}>
            <IconFile size={24} className={btnIconClass} />
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

const FileButtonDrops = memo(SideMenuFIleDropdown);

const FileButton = () => {
  return (
    <SidebarItem>
      <Tooltip content="File Menu" placement="right">
        <FileButtonDrops />
      </Tooltip>
    </SidebarItem>
  );
};