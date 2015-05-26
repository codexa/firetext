<?php

if (isset($_POST) && !empty($_POST)) {
	if($_POST['request']=='urls') {
		// Use Dropbox OAuth2 for recent versions
		if (version_compare($_POST['version'], 0.4, '>')) {
			$dropboxURL = 'https://codexa.github.io/firetext/auth/dropbox/oauth2/';
			$dropboxKey = 'p8qpg4ai84mfayx';
		} else {
			$dropboxURL = 'https://codexa.github.io/firetext/auth/dropbox/';
		}
		
		// Create variables
		$urls = array(
					"about"=>"",
					"credits"=>"",
					"support"=>"",
					"rate"=>"https://marketplace.firefox.com/app/firetext/ratings/add",
					"dropboxAuth"=>$dropboxURL,
					"dropboxKey"=>$dropboxKey
				);
	
		// Echo variables
		header('Content-Type: application/json');
		header('Access-Control-Allow-Origin: *');
		echo json_encode($urls);
		exit;
	}
}
