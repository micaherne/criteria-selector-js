<?php 
if (!defined('MOODLE_INTERNAL')) {
    die('Direct access to this script is forbidden.');    ///  It must be included from a Moodle page
}

require_once dirname(__FILE__).'/../ajaxlib.php';

class test_criteriatext_parser extends UnitTestCase {

    function setUp() { 
    	$this->parser = new strathcom_recipient_factory();
    }

    function tearDown() {
    }
    
    function testIsRegNo() {
    	$this->assertTrue($this->parser->isRegistrationNumber('201010101'));
    	$this->assertFalse($this->parser->isRegistrationNumber('20110111'));
    	$this->assertFalse($this->parser->isRegistrationNumber('182510101'));
    }
    
    function testIsDsUsername() {
    	$this->assertTrue($this->parser->isDSUsername('vas07101'));
    	$this->assertTrue($this->parser->isDSUsername('cjsh01'));
    	$this->assertFalse($this->parser->isDSUsername('va07101'));
    }
    
}