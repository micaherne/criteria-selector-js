<?php

require_once '../../../config.php';
require_once dirname(__FILE__).'/ajaxlib.php';
require_once $CFG->libdir.'/grouplib.php';

//TODO: Make this whole script permissions-aware!!!!
//TODO: Check session key

require_login();

$autocomplete = optional_param('autocomplete', null, PARAM_TEXT);
$criteriatext = optional_param('criteriatext', null, PARAM_TEXT);
$coursegroups = optional_param('coursegroups', null, PARAM_NUMBER);
$id = optional_param('id', null, PARAM_NUMBER);
$type = optional_param('type', null, PARAM_TEXT);

$result = array();

if(!is_null($autocomplete)) {

	// Strip into "course/grouping/group" format
	$parts = explode('/', $autocomplete);

	if(sizeof($parts) == 1) {
		$count = count_records_select('course', "shortname like '$autocomplete%'");
		if($count > 20) return array();

		if($courses = get_records_select('course', "shortname like '$autocomplete%'", 'fullname', 'id, shortname, fullname', 0, 40) ){
			foreach($courses as $course) {
				$result[] = array('value' => $course->shortname, 'label' => $course->fullname);
			}
		}
	} elseif(sizeof($parts) == 2) {
		if($course = get_record('course', 'shortname', $parts[0])) {
			//TODO: Take notice of $CFG->enablegroupings
			if($groupings = groups_get_all_groupings($course->id)){
				foreach($groupings as $grouping) {
					if(strlen($parts[1]) > 0 && strpos($grouping->name, $parts[1]) !== 0) continue;
					$t = $course->shortname . '/' . $grouping->name;
					$result[] = array('value' => $t, 'label' => $t);
				}
			}
				
		}
	} elseif(sizeof($parts) == 3) {
		if($course = get_record('course', 'shortname', $parts[0])) {
			//TODO: Take notice of $CFG->enablegroupings
			if($groupings = groups_get_all_groupings($course->id)){
				foreach($groupings as $grouping) {
					if(strlen($parts[1]) > 0 && $grouping->name != $parts[1]) continue;
					$groups = groups_get_all_groups($course->id, 0, $grouping->id);
						
					// Add "all groups"
					$result[] = array('value' => $course->shortname . '/' . $grouping->name . '/*', 'label' => $course->shortname . '/' . $grouping->name . '/[All Groups]');
					foreach($groups as $group) {
						$t = $course->shortname . '/' . $grouping->name . '/' . $group->name;
						$result[] = array('value' => $t, 'label' => $t);
					}
					break;
				}
			}

		}
	}

} elseif (!is_null($criteriatext)) {

	$factory = new strathcom_recipient_factory();
	$result = $factory->recipient($criteriatext);

} elseif (!is_null($coursegroups)) {
	
	if(! $course = get_record('course', 'id', $coursegroups)) {
		return $result;
	}
	
	if($CFG->enablegroupings === false) {
		if($groups = groups_get_all_groups($coursegroups) ) {
			foreach($groups as $group) {
				$result[] = array(
					'data' => $group->name, 
					'attr' => array('id' => $group->id, 'data-type' => 'group'),
					'checked' => true
				);
			}
		}
	} else {
		if(!is_null($id) && $id == 0) {
			if($groupings = groups_get_all_groupings($coursegroups)){
				foreach($groupings as $grouping) {
					$item = array(
						'data' => $grouping->name,
						'attr' => array('id' => $grouping->id, 'data-type' => 'grouping'),
						'checked' => true,
						'state' => 'closed' // This forces lazy loading of group data
					);
					$result[] = $item;
				}
			}
		} elseif(!is_null($id) && $id != 0) {
			if($groups = groups_get_all_groups($coursegroups, 0, $id) ) {
				foreach($groups as $group) {
					$result[] = array(
										'data' => $group->name, 
										'attr' => array('id' => $group->id, 'data-type' => 'group'),
										'checked' => true
					);
				}
			}
		}
	}

}

header("Content-Type: text/javascript");
echo json_encode($result);
