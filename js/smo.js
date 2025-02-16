// Remove a COA from the decision matrix
function removeCOA(x){

	var i = x.parentNode.rowIndex; // the clicked row
	document.getElementById('dmTable').deleteRow(i);	
	
}// End removeCOA-------------------------------------------



$(document).ready(function(){ /////////////////////////////////////////////////////// JQUERY //////

	// Dynotable-----------------------------   
   $('#ecTable').dynoTable({ 
   	onRowAdd: function() {
			var s = '<select class="importance"><option value="1.00">Equal to (1.00)</option><option value="1.25">Slightly more (1.25)</option><option value="1.50">Somewhat more (1.50)</option><option value="1.75">Much more (1.75)</option><option value="2.00">Considerably more (2.00)</option></select>';
			var n = $('#ecTable tr').length;
   		$('#ecTable tr').eq(n-2).find('td').eq(2).html(s); // Give next-to-last row a dropdown
   		$('#ecTable tr:last').find('td').eq(2).html('1.00'); // Set last row Importance to 1.00
   	},
   	onRowRemove: function() {
   		$('#ecTable tr:last').find('td').eq(2).html('1.00');
   	},
   	onRowReorder: function() {
			var s = '<select class="importance"><option value="1.00">Equal to (1.00)</option><option value="1.25">Slightly more (1.25)</option><option value="1.50">Somewhat more (1.50)</option><option value="1.75">Much more (1.75)</option><option value="2.00">Considerably more (2.00)</option></select>';
			var n = $('#ecTable tr').length;
			for (i = 1; i < n-1; i++) {
	   		if ($('#ecTable tr').eq(i).find('td').eq(2).html() == '1.00') 
	   			$('#ecTable tr').eq(i).find('td').eq(2).html(s); 
			} // for 
   		$('#ecTable tr:last').find('td').eq(2).html('1.00'); // Give last row a fixed value of 1.00
   	}
   });
   
   // UI Tabs   
   $(function() {
		$('#tabs').tabs();
	});
	
	$(function(){
          $('#dmTable').stupidtable();
      });
      
	var coaRowTemplate = '';// Used to 
   var dmReady = false; // Tells us that dmTable not ready for Analysis or AddCOA
    
	//----------------------------------------
	

	// Various button clicks (JQuery routines))
	$('#addCOA_btn').click(function(){
		if (dmReady) $('#dmTable').append(coaRowTemplate);
		else $('#dmNotReadyDialog').dialog({
			modal: true,	
			resizable: false,	
			width: 375,	
			buttons: {
				"Whatever": function() {
					$( this ).dialog( "close" );
				$('#tabs').tabs('select', 0);
				}
			}
			});
	});

	
	$('.startOver_btn').click(function(){
		$('#startOverDialog').dialog({
			modal: true,	
			resizable: false,		
			buttons: {
				"Yes, start over": function() {
					$( this ).dialog( "close" );
					window.location.reload();
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}});	
	});//--------------------------------------

	

//Send ECs to the Decision Matrix------------

	$("#sendECs_btn").click(function() {

		var n = $('.ecShortTitle').length;       // Count ECs
		
		for (var i = 0; i < n; i++) {
			if ($('.ecShortTitle').eq(i).val() == "") {
			   $('.ecShortTitle').eq(i).val("EC " + (i + 1));
			}
		} // i

		// Erase the SA report, just in case this is a redo
		document.getElementById('report').value = ""; 
		
		if (n < 2) { // Need at least 2 ECs
			$('#tooFewECsDialog').dialog({
				modal: true,	
				resizable: false,	
				width: 375,	
				buttons: {
					"OK": function() {
						$( this ).dialog( "close" );
					}
				}
			});	
		} else { // There are at least 2 COAs
			
			$('#dmTable tr:gt(2)').remove(); // Remove all COAs
			$('#dmTable tr').find('th:gt(3)').remove(); // Remove all EC cols beyond first 2		
			
			// Build COA row and EC header columns
			var coaRowStr = '<tr><td><input class="coaShortTitle"></input></td><td class="wgtSumZ"></td><td><input class="coaData"></input></td>'
									+ '<td><input class="coaData"></input></td>';
			var ecHeadStr = ''; // Additional head cells for dmTable
 			for (i = 3; i < n+1; i++) {
				ecHeadStr += '<th class="ecColumn"></th>';
				coaRowStr += '<td><input class="coaData"></input></td>';
			}	

			coaRowStr += '<td onclick="removeCOA(this)"><span class="ui-icon ui-icon-closethick"></span></td></tr>';
			ecHeadStr += '<th></th>'; // One more to line up with the row-remove X cells in the COA rows
			
			for (i = 0; i < 3; i++) {
				$('#dmTable tr').eq(i).append(ecHeadStr);
			}

			$("#dmTable").append(coaRowStr);			
			$("#dmTable").append(coaRowStr);	
		
			coaRowTemplate = coaRowStr; // Stored for use in AddCOA button	

			// Fill the thead cells	
			$('.projTitle').html( $('#enterProjTitle').val() ); // enter project title in dmTab and saTab
			 
			for (i = 0; i < n; i++) { // EC titles and units of measure
				$('.ecColumn').eq(i).html($('.ecShortTitle').eq(i).val()); 
				var unitString = $('.unitOfMeasure').eq(i).val() + " " + $('.MIBLIB').eq(i).val();	
				$('.ecColumn').eq(n + i).html(unitString);
			}

			// Compute and post the EC weights
			$('.ecColumn').eq(3*n-1).html('1.00'); // The last two columns are straightforward
			$('.ecColumn').eq(3*n-2).html($('.importance').eq(n-2).val());
			if (n > 2) {		
				var j = 0;
				prevWgt = $('.ecColumn').eq(3*n-2).html(); // Get first prevWgt
				for (i = n-3; i > -1; i--) { // EC weights
					var imp = $('.importance').eq(i).val();
					prevWgt = prevWgt*imp;
					$('.ecColumn').eq(3*n-3-j).html(prevWgt.toFixed(2));// Write new EC weight
					j++;
				}		
			} // End if n-2 > 0

		dmReady = true; // It's okay to analyze and add rows to dmTable
		$('#tabs').tabs('select', 1);

		} // End if else n < 2 at the very beginning of this function  
		
  	});
//-------------------------------------------



// Run the main analysis---------------------
function runAnalysis() {

	$('#dmTable tr').slice(3).find('*').attr('style', 'color:black'); // ensure all red highlighting is turned off

	var t = document.getElementById('ecTable'); // get the table
	var ecN = t.rows.length - 1; // number of ECs
	var t = document.getElementById('dmTable'); // get the table
	var dmN = t.rows.length - 3; // number of COAs
	var coaDataN = ecN * dmN;
	var unBroken = true;
 
	var xArray = new Array(coaDataN); // COA rows
	var zArray = new Array(coaDataN); // COA rows
	var meanArray = new Array(ecN);	//each column's mean
	var stdevArray = new Array(ecN);	// each column's standard deviation
	var wgtSumArray = new Array(dmN);

	// If the user left out a COA name, give it one
	for (var i = 0; i < dmN; i++) {
		if ($('.coaShortTitle').eq(i).val() == "") {
		   $('.coaShortTitle').eq(i).val("COA " + (i + 1));
		}
	} // i
	
	// Fill xMatrix & xSqrMatrix
	for (i = 0; i < coaDataN; i++) {
		xArray[i] = $('.coaData').eq(i).val();
	}

	// Compute column means and standard deviations
	for (j = 0; j < ecN; j++) {
		var sumX = 0;		// initialize
		var sumXsqr = 0;
		for (i = 0; i < dmN; i++) {
			var x = parseFloat(xArray[i*ecN+j]);
			sumX = sumX + x; // to compute mean
			sumXsqr = sumXsqr + x * x;
		}	// i
		meanArray[j] = sumX/dmN;
		stdevArray[j] = Math.sqrt((sumXsqr/dmN) - (meanArray[j]*meanArray[j]));
	}	// j

	// Compute z scores
	ComputeZ: // label for break
	for (j = 0; j < ecN; j++) {
		for (i = 0; i < dmN; i++) {
			if (stdevArray[j] != 0)	{
				var z = (xArray[i*ecN+j] - meanArray[j])/stdevArray[j];
				var moreOrLess = $('.MIBLIB').eq(j).val();
				if (moreOrLess == "(LIB)") z = -1 * z;
				zArray[i*ecN+j] = z;
				if (isNaN(z)) {
					$('#badNumberDialog').dialog({
						modal: true,	
						resizable: false,	
						width: 375,	
						buttons: {
							"OK": function() {
								$( this ).dialog( "close" );
							}
						}
					});
					unBroken = false;
					break ComputeZ;
				} // if isNaN
			} else {
				var offendingEC = $('.ecShortTitle').eq(j).val();
				$('#divByZeroDialog').dialog({
					modal: true,	
					resizable: false,	
					width: 375,	
					buttons: {
						"OK": function() {
							$( this ).dialog( "close" );
						}
					}
				}); // divByZeroDialog

				unBroken = false;
				break ComputeZ;
				
			} // else
		}	// i
	}	// j


	// Compute weighted sums
	if (unBroken) { 
		for (j = 0; j < dmN; j++) {
			wgtSumArray[j] = 0;
			for (i = 0; i < ecN; i++) {
				var wgt = parseFloat($('.ecColumn').eq(2*ecN + i).html()); // get the weight
				wgtSumArray[j] = wgtSumArray[j] + wgt * zArray[j*ecN+i];
			} // i

			$('.wgtSumZ').eq(j).html(wgtSumArray[j].toFixed(4)); // Post result to dmTable
		} // j

	// Write the sensitivity analysis
	// Must do this before we sort the table
	var saArray = new Array(dmN);
	var sensitivity = false;
	var r = document.getElementById('report');
	var carriageReturn = "";  // Don't \n on the first COA label
	r.innerHTML += document.getElementById('enterProjTitle').innerHTML;  // Copy the project title
	r.value = "";  // Erase any pervious work
		
	// Build saArray: 0 = sort, 1 = COA name, 2 = Z, 3 = C, 4 = wgtSum -----------------------------------------------------------
	var coaKOTH = "";
	var winningCOA = "";  // for storing the winning COA later
	for (j = 0; j < ecN; j++) {  
		sensitivity = false;  // Not sensitive...for now
    	r.value += carriageReturn + $('.ecShortTitle')[j].value; // Label the next EC
		carriageReturn = "\n";  // Use \n for subsequent COA label 
		wgt = parseFloat($('.ecColumn').eq(2*ecN + j).html()); // get the weight

		// Build saArray's rows with 5 columns
		for (i = 0; i < dmN; i++) {
			saArray[i] = new Array(5);
		}		
		
		// Populate saArray
		for (i = 0; i < dmN; i++) {
			saArray[i][0] = $('.coaShortTitle').get(i).value;    // COA name
			saArray[i][1] = zArray[i*ecN+j];                     // Z score
			saArray[i][2] = wgtSumArray[i] - wgt*saArray[i][1];  // C = T - wZ
		  	saArray[i][3] = saArray[i][1] + saArray[i][2];       // Z + C
			saArray[i][4] = wgtSumArray[i];                      // weighted sums at first, wgt after that
		} // i

		function sortByWgtSum(a,b){        // high to low
			if (a[4] > b[4]) return -1;
			if (a[4] < b[4]) return 1;
			return 0;
		}

		// Get the winningCOA
		saArray.sort(sortByWgtSum);
		winningCOA = saArray[0][0];

		// Now sort the array by Z + C, implies wgt = 1
		function sortByZplusC(a,b){        // high to low
			if (a[3] > b[3]) return -1;
			if (a[3] < b[3]) return 1;
			return 0;
		}
		saArray.sort(sortByZplusC);        // high to low

		// Get coaKOTH at wgt = 1 and report if it's not the winningCOA
 	   	coaKOTH = saArray[0][0];           // the first coaKOTH
		if (winningCOA != coaKOTH) {    
		  r.value += "\n  " + coaKOTH + " becomes the best COA at a weight of 1.0";
		  sensitivity = true;  // This EC is not NOT SENSITIVE
		}	
		// Now use the last column to store and 
		// sort by breakeven weights using this sorting function
		function sortByWgt(a,b){      // sort low to high
			if (a[4] < b[4]) return -1;
			if (a[4] > b[4]) return 1;
			return 0;
		}
		
		var k = 0;      // count weights = 9999
		var diffZ = 0.0;
		var diffC = 0.0;
		var needToCheck = true; 

		// Now keep computing breakeven weights until there are no more
		while (k < (dmN - 1)) { // (needToCheck == true) {
			k = 0;
			for (i = 1; i < dmN; i++) {  // start with 2nd row, i = 1
				diffZ = saArray[i][1] - saArray[0][1];  // Z1 - Z2
				diffC = saArray[0][2] - saArray[i][2];  // C2 - C1
				if ((diffZ > 0) && (diffC > 0)) {  // then coaKOTH can be toppled
			   	   saArray[i][4] = diffC/diffZ;    // the wgt where T1 = T2
			   	   sensitivity = true;             // This means EC is not NOT SENSITIVE
				}
				else  // then this COA cannot beat coaKOTH
				{
				   saArray[i][4] = 10000 + k; // its breakeven weight gets coded high, add k so no ties
				   k = k + 1;	   		      // count these COAs
				}  // if coaKOTH can be toppled
			} // i

			saArray[0][4] = 11000;  // Raise the current coaKOTH's weight, get it out of the eunning
			if (k < (dmN - 1)) {
		   	   saArray.sort(sortByWgt); // sort by wgt
			   coaKOTH = saArray[0][0];
	  		   r.value += "\n  " + coaKOTH + " becomes the best COA at a weight of " + saArray[0][4].toFixed(4);
			}
			else     // There are no more COAs who could beat coaKOTH
			{
			   needToCheck = false;
			}  // if (k < (dmN - 1))

		} // while needToCheck for a better COA 

		if (sensitivity == false) {
		   r.value += "\n  Not Sensitive";
		}		

	} // j	-----------------------------------------------------------------------------------------------------------------

		
		// Sort dmTable by weighted sums
		$('#sortCell').trigger('click');
		if ($('.wgtSumZ:first').html() < $('.wgtSumZ:last').html()) {
			$('#sortCell').trigger('click'); // If a reanalysis sort, put min on top; click again to put max on top
		} 
		$('#dmTable tr').eq(3).find('*').attr('style', 'color:red'); // then highlight the winning COA
	} // if unBroken compute weighted Z sums
	


} // runAnalysis-----------------------------


	$('#runAnalysis_btn').click(function(){
		if (dmReady) {
			if ($('#dmTable tr').length > 4) { // Need (a) ECs sent and (b) 2 COAs to run analysis
				runAnalysis();
//				$('#tabs').tabs('select', 2); // Go to Sensitivity Analysis
			} else $('#tooFewCOAsDialog').dialog({
				modal: true,	
				resizable: false,	
				width: 375,	
				buttons: {
					"OK": function() {
						$( this ).dialog( "close" );
					}
				}
		}); // if else dmTable length > 4
			
		}	else $('#dmNotReadyDialog').dialog({
				modal: true,	
				resizable: false,	
				width: 375,	
				buttons: {
					"Whatever": function() {
						$( this ).dialog( "close" );
						$('#tabs').tabs('select', 0);
					}
				}
				}); // if else dmReady
			
	}); // End runAnalysis_btn click	
//--------------------------------------------
	


});// End document ready function /////////////////////////////////////////////////// JQUERY //////


		