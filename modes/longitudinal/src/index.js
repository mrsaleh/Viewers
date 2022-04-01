import toolbarButtons from './toolbarButtons.js';
import { hotkeys } from '@ohif/core';
import { CommandsManager } from '@ohif/core'

const ohif = {
  layout: 'org.ohif.default.layoutTemplateModule.viewerLayout',
  sopClassHandler: 'org.ohif.default.sopClassHandlerModule.stack',
  hangingProtocols: 'org.ohif.default.hangingProtocolModule.default',
};

const tracked = {
  measurements: 'org.ohif.measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: 'org.ohif.measurement-tracking.panelModule.seriesList',
  viewport: 'org.ohif.measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: 'org.ohif.dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: 'org.ohif.dicom-sr.viewportModule.dicom-sr',
};

export default function mode({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id: 'viewer',
    displayName: 'Diagnostic',
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }) => {
      console.log('services manager:', servicesManager)
      console.log('extension manager:', extensionManager)

      // Note: If tool's aren't initialized, this doesn't have viewport/tools
      // to "set active". This is mostly for the toolbar UI state?
      // Could update tool manager to be always persistent, and to set state
      // on load?
      const { ToolBarService } = servicesManager.services;
      const { MeasurementService } = servicesManager.services


      // const commandsManagerConfig = {
      //   getAppState: () => { },
      //   /** Used by commands to determine active context */
      //   getActiveContexts: () => [
      //     'VIEWER',
      //     'DEFAULT',
      //     'ACTIVE_VIEWPORT::CORNERSTONE',
      //   ],
      // };

      // const commandsManager = new CommandsManager(commandsManagerConfig);

      // MeasurementService.subscribe(MeasurementService.EVENTS.MEASUREMENT_ADDED,
      //   ({ source, measurement, data, datasource }) => {
      //     console.log('source:', source)
      //     console.log('measurement:', measurement)
      //     console.log('data:', data)
      //     console.log('datasource:', datasource)
      //   }
      // )

      // console.log('measument service:', MeasurementService)

      // commandsManager.createContext('PRECIOUS')

      const interaction = {
        groupId: 'primary',
        itemId: 'Wwwc',
        interactionType: 'tool',
        commandOptions: undefined,
      };

      // _commandsManager.registerCommand('VIEWER', 'diagnose', {
      //   commandFn: (params) => {
      //     console.log("Precious command called!")
      //   }
      // })

      // commandsManager.runCommand('CMD_PRECIOUS_DIAGNOSE', {}, 'PRECIOUS');

      ToolBarService.recordInteraction(interaction);

      ToolBarService.init(extensionManager);
      ToolBarService.addButtons([{
        id: 'Diagnose',
        type: 'ohif.radioGroup',
        props: {
          type: 'action',
          icon: 'eye-visible',
          label: 'Diagnose',
          // commandOptions: { toolName: 'Zoom' },
          commandName: 'precious.ai.diagnose'
        },
      }])
      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'Diagnose',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MoreTools',
      ]);
    },
    onModeExit: () => { },
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      // Slide Microscopy modality not supported by basic mode yet
      return !modalities_list.includes('SM')
    },
    routes: [
      {
        path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [tracked.thumbnailList],
              // TODO: Should be optional, or required to pass empty array for slots?
              rightPanels: [tracked.measurements],
              viewports: [
                {
                  namespace: tracked.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
                {
                  namespace: dicomsr.viewport,
                  displaySetsToDisplay: [dicomsr.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: [
      'org.ohif.default',
      'org.ohif.cornerstone',
      'org.ohif.measurement-tracking',
      'org.ohif.dicom-sr',
      'com.precious-md.ai'
    ],
    hangingProtocols: [ohif.hangingProtocols],
    sopClassHandlers: [ohif.sopClassHandler, dicomsr.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

window.longitudinalMode = mode({});
