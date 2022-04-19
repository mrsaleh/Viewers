import ImageSet from '@ohif/core/src/classes/ImageSet';
import { IWebApiDataSource } from '@ohif/core';

import React from 'react';
import { Input, Dialog, Label, Header, Table, TableRow, TableCell } from '@ohif/ui';


const waitForAIModalId = 'precious-ai-processing-dialog'
const aiResultModalId = 'precious-ai-result-dialog'
let canceled = false


/**
 * This function shows report modal
 */
function showReportModal(UIModalService, data) {
  console.log("Report:", data)
  UIModalService.show({
    id: aiResultModalId,
    // centralize: true,
    // isDraggable: false,
    // showOverlay: true,
    shouldCloseOnEsc: true,
    content: Dialog,
    contentProps: {
      title: 'Report',
      value: {},
      noCloseButton: false,
      onClose: () => UIModalService.hide({ id: aiResultModalId }),
      actions: [
        // { id: 'save', text: 'Save report', type: 'primary' },
        // { id: 'close', text: 'Close', type: 'secondary' },
        { id: 'close', text: 'Close', type: 'primary' },
      ],
      onSubmit: (data) => {
        switch (data.action.id) {
          // case 'save':
          //   UIModalService.hide({ id: aiResultModalId })
          //   break;
          case 'close':
            UIModalService.hide({ id: aiResultModalId })
            break;
        }

      },
      body: ({ value, setValue }) => {
        return (
          // <div className="p-4 bg-primary-dark">
          //   <Label text="Thank you for your patient, here's the result" style={{ color: '#fff' }} />
          //   <Label text="Chance:" style={{ color: '#fff' }} />
          //   <Label text={data.percentage.toString()} style={{ color: '#fff' }} />
          // </div>
          <Table>
            <TableRow>
              <Label text="Thank you for your patient, here's the AI report." style={{ color: '#fff' }} />
            </TableRow>

            <TableRow>
              <TableCell>
                <Label text="State:" style={{ color: '#fff' }} />
              </TableCell>
              <TableCell>
                <Label text={data.state} style={{ color: '#fff' }} />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <Label text="Chance:" style={{ color: '#fff' }} />
              </TableCell>
              <TableCell>
                <Label text={data.percentage.toString()} style={{ color: '#fff' }} />
              </TableCell>
            </TableRow>

          </Table>

        );
      },
    },
  });
}

function hideWaitForAIModal(UIModalService) {
  UIModalService.hide({ id: waitForAIModalId })
}

function showWaitForAIModal(UIModalService) {
  canceled = false
  UIModalService.show({
    id: waitForAIModalId,
    // centralize: true,
    // isDraggable: false,
    // showOverlay: true,
    shouldCloseOnEsc: false,
    content: Dialog,
    contentProps: {
      title: 'Diagnosing ...',
      value: {},
      noCloseButton: true,
      onClose: () => UIModalService.hide({ id: waitForAIModalId }),
      actions: [
        { id: 'cancel', text: 'Cancel', type: 'secondary' },
      ],
      onSubmit: (data) => {
        if (data.action.id === 'cancel') {
          canceled = true
          UIModalService.hide({ id: waitForAIModalId })
        }
      },
      body: ({ value, setValue }) => {
        return (
          <div className="p-4 bg-primary-dark">
            <Label text='AI is diagnosing the issued study, be patient!' style={{ color: '#fff' }} />
          </div>
        );
      },
    },
  });
}

async function callAI(request_data) {

  const response = await fetch('https://viewer.precious-md.com/ai/api/v1/prediction/select',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
      },
      body: JSON.stringify(request_data)
    })

  const data = await response.json()
  console.log("Server response:", data)
  return data
}

function prepareRequestData(measurement) {
  let sum_x = 0
  let sum_y = 0
  for (let i = 0; i < measurement.points.length; i++) {
    sum_x += measurement.points[i].x
    sum_y += measurement.points[i].y
  }

  const ellipse_center = {
    x: sum_x / measurement.points.length,
    y: sum_y / measurement.points.length
  }

  const request_data = {
    study_id: measurement.referenceStudyUID,
    series_id: measurement.referenceSeriesUID,
    instance_id: measurement.SOPInstanceUID,
    center_x: ellipse_center.x,
    center_y: ellipse_center.y
  }

  return request_data
}

/**
 *
 */
export default {
  id: 'com.precious-md.ai',

  onModeEnter({ servicesManager, commandsManager }) {

    console.log('my extension commands manager:', commandsManager)
    commandsManager.registerCommand('VIEWER', 'precious.ai.diagnose', {
      commandFn: (params) => {
        console.log('precious saleh command called!')

        cornerstoneTools.setToolActive('EllipticalRoi',
          {
            mouseButtonMask: 1,
          });

      }
    })


    const { MeasurementService } = servicesManager.services

    MeasurementService.subscribe(MeasurementService.EVENTS.MEASUREMENT_ADDED,
      ({ source, measurement, data, datasource }) => {
        console.log('source:', source)
        console.log('measurement:', measurement)
        console.log('data:', data)
        console.log('datasource:', datasource)

        const { UIModalService } = servicesManager.services

        if (measurement.type == "value_type::ellipse") {

          const requestData = prepareRequestData(measurement)
          showWaitForAIModal(UIModalService)
          callAI(requestData).then((aiResponse) => {
            if (!canceled) {
              hideWaitForAIModal(UIModalService)
              showReportModal(UIModalService, aiResponse)
            }

          })

          console.log('request data:', requestData)



        }
      })
  },

}
