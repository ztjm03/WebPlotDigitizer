/*
	WebPlotDigitizer - http://arohatgi.info/WebPlotDigitizer

	Copyright 2010-2014 Ankit Rohatgi <ankitrohatgi@hotmail.com>

	This file is part of WebPlotDigitizer.

    WebPlotDigitizer is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    WebPlotDigitizer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with WebPlotDigitizer.  If not, see <http://www.gnu.org/licenses/>.


*/

var wpd = wpd || {};
wpd.dataTable = (function () {

    var rawData,
        sortedData,
        formattedData,
        tableText;

    function getSeriesData() {
        rawData = wpd.appData.getPlotData().getDataFromActiveSeries();
    }

    function sortRawData() {
        sortedData = rawData.slice(0);
        var sortingKey = document.getElementById('data-sort-variables').value,
            sortingOrder = document.getElementById('data-sort-order').value,
            isAscending = sortingOrder === 'ascending',
            isRaw = sortingKey === 'raw',
            isConnectivity = sortingKey === 'NearestNeighbor',
            dataIndex,
            axes = wpd.appData.getPlotData().axes,
            plotDim = axes.getDimensions();

        if (isRaw) {
            return;
        }

        if(!isConnectivity) {
            dataIndex = parseInt(sortingKey, 10);
            sortedData.sort(function(a, b) {
                if(a[dataIndex] > b[dataIndex]) {
                    return isAscending ? 1: -1;
                } else if (a[dataIndex] < b[dataIndex]) {
                    return isAscending ? -1 : 1;
                }
                return 0;
            });
            return;
        }

        if(isConnectivity) {
            var mindist, compdist, minindex,
                swapVariable = [1.0, 1.0, 1.0],
                ii, jj, 
                pointsPicked = rawData.length;

            for(ii = 0; ii < pointsPicked - 1; ii++) {
                minindex = -1;

                for(jj = ii + 1; jj < pointsPicked; jj++) {
                   compdist = (sortedData[ii][0] - sortedData[jj][0])*(sortedData[ii][0] - sortedData[jj][0]) + 
                                    (sortedData[ii][1] - sortedData[jj][1])*(sortedData[ii][1] - sortedData[jj][1]);
                   if(plotDim === 3) {
                       compdist += (sortedData[ii][2] - sortedData[jj][2])*(sortedData[ii][2] - sortedData[jj][2]);
                   }
                   
                   if((compdist < mindist) || (minindex === -1)) {
                        mindist = compdist;
                        minindex = jj;
                   } 
                }

                swapVariable[0] = sortedData[minindex][0];
                sortedData[minindex][0] = sortedData[ii+1][0];
                sortedData[ii+1][0] = swapVariable[0];

                swapVariable[1] = sortedData[minindex][1];
                sortedData[minindex][1] = sortedData[ii+1][1];
                sortedData[ii+1][1] = swapVariable[1];

                if(plotDim === 3) {
                    swapVariable[2] = sortedData[minindex][2];
                    sortedData[minindex][2] = sortedData[ii+1][2];
                    sortedData[ii+1][2] = swapVariable[2];
                }            
            }
        }

    }
  
    function setupControls() {
        var $sortingVariables = document.getElementById('data-sort-variables'),
            $variableNames = document.getElementById('dataVariables'),
            $dateFormattingContainer = document.getElementById('data-date-formatting-container'),
            $dateFormatting = document.getElementById('data-date-formatting'),
            axes = wpd.appData.getPlotData().axes,
            dataSeries = wpd.appData.getPlotData().getActiveDataSeries(),
            axesLabels = axes.getAxesLabels(),
            labIndex,
            variableHTML = '',
            variableListHTML = axesLabels.join(', '),
            dateFormattingHTML = '';
            isAnyVariableDate = false,
            tableVariables = axesLabels,
            dimCount = axes.getDimensions();

        if (dataSeries.hasMetadata()) {
            tableVariables = axesLabels.concat(dataSeries.getMetadataKeys()); 
            variableListHTML = tableVariables.join(', ');
        }

        $dateFormattingContainer.style.display = 'none';
        
        variableHTML += '<option value="raw">Raw</option>';

        for(labIndex = 0; labIndex < tableVariables.length; labIndex++) {
            variableHTML += '<option value="' + labIndex + '">' + tableVariables[labIndex] + '</option>';
            if(labIndex < dimCount && axes.isDate != null && axes.getInitialDateFormat != null && axes.isDate(labIndex)) {
                dateFormattingHTML += axesLabels[labIndex] + ' <input type="text" length="15" value="' 
                    + axes.getInitialDateFormat(labIndex) + '" id="data-format-string-'+ labIndex +'"/>';
                isAnyVariableDate = true;
            }
        }
        variableHTML += '<option value="NearestNeighbor">Nearest Neighbor</option>';

        $sortingVariables.innerHTML = variableHTML;
        $variableNames.innerHTML = variableListHTML;

        if(isAnyVariableDate) {
            $dateFormattingContainer.style.display = 'inline-block';
            $dateFormatting.innerHTML = dateFormattingHTML;            
        }

    }

    function updateSortingControls() {
        var sortingKey = document.getElementById('data-sort-variables').value,
            $sortingOrder = document.getElementById('data-sort-order'),
            isConnectivity = sortingKey === 'NearestNeighbor',
            isRaw = sortingKey === 'raw';
        
        if(isConnectivity || isRaw) {
            $sortingOrder.setAttribute('disabled', true);
        } else {
            $sortingOrder.removeAttribute('disabled');
        }
    }

    function makeTable() {
        if(rawData == null) {
            return;
        }
        var axes = wpd.appData.getPlotData().axes,
            dataSeries = wpd.appData.getPlotData().getActiveDataSeries(),
            dimCount = axes.getDimensions(),
            metaKeyCount = dataSeries.getMetadataKeys().length,
            rowCount = rawData.length,
            rowi, dimi, rowValues,
            $digitizedDataTable = document.getElementById('digitizedDataTable'),
            formatStrings = [];

        tableText = '';
        for(rowi = 0; rowi < rowCount; rowi++) {
            rowValues = [];
            for(dimi = 0; dimi < dimCount + metaKeyCount; dimi++) {
                if(dimi < dimCount && axes.isDate != null && axes.isDate(dimi)) {
                    if(formatStrings[dimi] === undefined) {
                        formatStrings[dimi] = document.getElementById('data-format-string-' + dimi).value;
                    }
                    rowValues[dimi] = wpd.dateConverter.formatDateNumber(sortedData[rowi][dimi], formatStrings[dimi]);
                } else {
                    rowValues[dimi] = sortedData[rowi][dimi];
                }
            }
            tableText += rowValues.join(', ');
            tableText += '\n';
        }
        $digitizedDataTable.value = tableText;
    }

    function getSortedData() {
        return sortedData;
    }

    function showTable() {
        if(!wpd.appData.isAligned()) {
            return;
        }
        wpd.popup.show('csvWindow');
        getSeriesData();
        setupControls();
        sortRawData();
        makeTable();
        updateSortingControls();
    }

    function generateCSV() {

        var formContainer,
            formElement,
            formData,
            jsonData = JSON.stringify(tableText);
            
        // Create a hidden form and submit
        formContainer = document.createElement('div'),
        formElement = document.createElement('form'),
        formData = document.createElement('input');

        formElement.setAttribute('method', 'post');
        formElement.setAttribute('action', 'php/csvexport.php');

        formData.setAttribute('type', "text");
        formData.setAttribute('name', "data");

        formElement.appendChild(formData);
        formContainer.appendChild(formElement);
        document.body.appendChild(formContainer);
        formContainer.style.display = 'none';

        formData.setAttribute('value', jsonData);
        formElement.submit();
        document.body.removeChild(formContainer);
    }

    function exportToPlotly() {
        if(rawData == null || rawData.length === 0) {
            return;
        }

        var formContainer = document.createElement('div'),
            formElement = document.createElement('form'),
            formData = document.createElement('input');
        
        
        formElement.setAttribute('method', 'post');
        formElement.setAttribute('action', 'https://plot.ly/external');
        formElement.setAttribute('target', '_blank');
        
        formData.setAttribute('type', "text");
        formData.setAttribute('name', "data");

        formElement.appendChild(formData);
        formContainer.appendChild(formElement);
        document.body.appendChild(formContainer);
        formContainer.style.display = 'none';

        var jsonData = { data: [] },
            axes = wpd.appData.getPlotData().axes,
            dimCount = axes.getDimensions(),
            rowCount = rawData.length,
            rowi, dimi,
            //axesLabels = axes.getAxesLabels(); - if I do this then plotly doesn't make a plot by default
            axesLabels = ['x', 'y', 'z'];

        jsonData.data[0] = {};
        for(rowi = 0; rowi < rowCount; rowi++) {
            rowValues = [];
            for(dimi = 0; dimi < dimCount; dimi++) {
                if(rowi === 0) {
                    jsonData.data[0][axesLabels[dimi]] = [];
                }
                if(axes.isDate != null && axes.isDate(dimi)) {
                    jsonData.data[0][axesLabels[dimi]][rowi] = wpd.dateConverter.formatDateNumber(sortedData[rowi][dimi], 'yyyy-mm-dd');
                } else {
                    jsonData.data[0][axesLabels[dimi]][rowi] = sortedData[rowi][dimi];
                }
            }
        }
        formData.setAttribute('value', JSON.stringify(jsonData));
        formElement.submit();
        document.body.removeChild(formContainer); 
    }

    function selectAll() {
        var $digitizedDataTable = document.getElementById('digitizedDataTable');
        $digitizedDataTable.focus();
        $digitizedDataTable.select();
    }

    function reSort() {
        updateSortingControls();
        sortRawData();
        makeTable();
    }

    return {
        getSeriesData: getSeriesData,
        showTable: showTable,
        updateSortingControls: updateSortingControls,
        reSort: reSort,
        selectAll: selectAll,
        generateCSV: generateCSV,
        exportToPlotly: exportToPlotly
    };
})();

