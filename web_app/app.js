$(document).ready(function () {

	GTV_images = []
	GTV_labels = []
	pids = []
	
	// AJAX Call to get all the GTV images saved in GTV_images folder, folowed by popuating index.html page with first GTV of all unlabeled images 
	$.when($.ajax({
	  url: "GTV_images/",
	  cache: false,
	  success: function(data){
	     $(data).find("a:contains(.png)").each(function(){
	     	
	        // Loop through all GTV_image names
	        var images = $(this).attr("href");
	        images = decodeURIComponent(images);
	        GTV_images.push(images);

	     });
	  }
	})).then(function(){
		
		// Get list of patient ids
		var i;
		for (i = 0; i < GTV_images.length; i++) {
			pid = GTV_images[i].split("__")[0]
			if (pids.indexOf(pid) == -1) {pids.push(pid)}
		}

		// Get labeled GTV images and then subtract them from array that contains all GTV image names (GTV_images)
		labeled_GTVs = []

		$.when($.ajax({

			type: "GET",
			url: "labeled_GTVs.csv",
			dataType: "text",
			cache: false,

			success: function(data){

				// Make array of labeled GTV image names
				labeled_GTVs = $.csv.toArrays(data);
				labeled_GTVs = labeled_GTVs.map(function(row) { return row[0] });

				// Remove previously labeled GTV images from GTV_images array
				unlabeled_GTVs = GTV_images.filter( function( el ) { return labeled_GTVs.indexOf( el ) < 0 });

			}  
		})).then(function(){

			// Populate index.html with first unlabeled GTV image
			current_img = "";
			img_name = unlabeled_GTVs[0];
			info = img_name.split("__");
			current_img = img_name;

			// Get # of GTVs and segments for each CT scan 
			segments = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1] + "__" + info[2]) !== -1)
			GTVs = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1]) !== -1)
			GTVs_unique = []
			var i;
			for (i = 0; i < GTVs.length; i++) {
				GTV = GTVs[i].split("__")[2]
	  			if (GTVs_unique.indexOf(GTV) == -1) {GTVs_unique.push(GTV)}
			}

			num_segments = segments.length
			num_GTVs = GTVs_unique.length

			segment_num = segments.indexOf(img_name)+1
			GTV_num = GTVs_unique.indexOf(info[2])+1


			// Write in HTML file 
			$('#pid').html(info[0] + " (" + (pids.indexOf(info[0]) + 1) + " of " + pids.length + ")");
			$('#ctid').html(info[1]);
			$('#GTVname').html(info[2].replace("%","_") + " (" + GTV_num + " of " + GTVs_unique.length + ")");
			$('#GTVsegment').html(info[3].replace("vol", "").replace(".png", "") + " (" + segment_num + " of " + segments.length + ")");

			$("#main_img").attr("src","GTV_images/" + img_name);
		
		})
		
	});

	// User input buttons to label images
	$(".screening_btns").click(function() {

		clicked_button = this.id
		console.log(clicked_button)
		$(".screening_btns").css("backgroundColor", "");

		// Save input on server using save_input python script 
		$.ajax({
	    	url: "cgi-bin/save_input.py",
	    	type: "POST",
	    	data: {'button': String(clicked_button), 'img_name': String(img_name)},
	    	dataType: "json",
	    	success: function(response) {
	        	console.log(response)
	    	},
	    	error: function(xhr, status, error) {
	                var err = eval("(" + xhr.responseText + ")");
	                alert(err.Message);
	    	}
		});

		// Get Next GTV Image and update index.html page with new image
		index_cur = GTV_images.indexOf(current_img);
		next_index = index_cur + 1;

		if (next_index < GTV_images.length){
			img_name = GTV_images[next_index];
			current_img = img_name;
			info = img_name.split("__");


			// Determine if next image has already been labeled (e.g. in cases when back was pressed) and then highlight the button corresponding to the label
			try{
					prev_button_clicked = GTV_labels[GTV_labels.map(function(row){return row[0]}).indexOf(img_name)][1];
					console.log(prev_button_clicked);
					$(".screening_btns").css("backgroundColor", "");
					$('#'+prev_button_clicked).css("backgroundColor", "#ccc");
				}
				catch(e){
					console.log(e)
			}


			// Get # of GTVs and segments for each CT scan 
			segments = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1] + "__" + info[2]) !== -1)
			GTVs = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1]) !== -1)
			GTVs_unique = []
			var i;
			for (i = 0; i < GTVs.length; i++) {
				GTV = GTVs[i].split("__")[2]
	  			if (GTVs_unique.indexOf(GTV) == -1) {GTVs_unique.push(GTV)}
			}

			num_segments = segments.length
			num_GTVs = GTVs_unique.length

			segment_num = segments.indexOf(img_name)+1
			GTV_num = GTVs_unique.indexOf(info[2])+1


			// Write in HTML file 
			$('#pid').html(info[0] + " (" + (pids.indexOf(info[0]) + 1) + " of " + pids.length + ")");
			$('#ctid').html(info[1]);
			$('#GTVname').html(info[2].replace("%","_") + " (" + GTV_num + " of " + GTVs_unique.length + ")");
			$('#GTVsegment').html(info[3].replace("vol", "").replace(".png", "") + " (" + segment_num + " of " + segments.length + ")");

			$("#main_img").attr("src","GTV_images/" + img_name);
		}
		else{alert("Congratulations! You've finished screening images!")}
	});

	// Back Button to go to last image 
	$(".back_btn").click(function() {

		// Get labels of previously labeled GTV images
		$.when($.ajax({
			type: "GET",
			url: "labeled_GTVs.csv",
			dataType: "text",
			cache: false,
			success: function(data){
				GTV_labels = []
				GTV_labels = $.csv.toArrays(data);
				console.log(GTV_labels)

			}  
		})).then(function(){

			clicked_button = this.id
			console.log(clicked_button)

			index_cur = GTV_images.indexOf(current_img)
			prev_index = index_cur - 1

			// There must be prior images to go back to when clicking back button
			if (prev_index >= 0){

				console.log("going back");

				// Get Previous GTV Image and update index.html page with prior image
				img_name = GTV_images[prev_index];
				current_img = img_name;
				info = img_name.split("__");
				
				// Get # of GTVs and segments for each CT scan 
				segments = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1] + "__" + info[2]) !== -1)
				GTVs = GTV_images.filter(item => item.indexOf(info[0] + "__" + info[1]) !== -1)
				GTVs_unique = []
				var i;
				for (i = 0; i < GTVs.length; i++) {
					GTV = GTVs[i].split("__")[2]
		  			if (GTVs_unique.indexOf(GTV) == -1) {GTVs_unique.push(GTV)}
				}

				num_segments = segments.length
				num_GTVs = GTVs_unique.length

				segment_num = segments.indexOf(img_name)+1
				GTV_num = GTVs_unique.indexOf(info[2])+1


				// Write in HTML file 
				$('#pid').html(info[0] + " (" + (pids.indexOf(info[0]) + 1) + " of " + pids.length + ")");
				$('#ctid').html(info[1]);
				$('#GTVname').html(info[2].replace("%","_") + " (" + GTV_num + " of " + GTVs_unique.length + ")");
				$('#GTVsegment').html(info[3].replace("vol", "").replace(".png", "") + " (" + segment_num + " of " + segments.length + ")");

				$("#main_img").attr("src","GTV_images/" + img_name);

				// Get the previous label from GTV_labels array and highlight button corresponding to previous label
				prev_button_clicked = GTV_labels[GTV_labels.map(function(row){return row[0]}).indexOf(img_name)][1];
				$(".screening_btns").css("backgroundColor", "");
				$('#'+prev_button_clicked).css("backgroundColor", "#ccc");
			}
		})

	});

	// Listen for keypress corresponding to buttons 
	$(function() {
	   $(document).keydown(function(e) {
	    switch(e.which) { 
	        case 49: // 1 key
	            $("#lung-tumor").trigger("click")
	        	break;
	        case 50: // 2 key
	        	$("#hilar-mediastinal-lymph-node").trigger("click")
	        	break;
	        case 51: // 2 key
	        	$("#contour-misalignment").trigger("click")
	        	break;
	        case 52: // 2 key
	        	$("#other-lesion").trigger("click")
	        	break;
	        case 53: // 2 key
	        	$("#uncertain").trigger("click")
	        	break;
	        case 54: // 2 key
	        	$(".back_btn").trigger("click")
	        	break;
	    } 
		});
	});



});
