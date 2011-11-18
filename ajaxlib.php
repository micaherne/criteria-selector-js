<?php

require_once dirname(__FILE__).'/../operators.php';

class strathcom_recipient_factory {

	public function __construct() {
		global $CFG;
		require_once($CFG->dirroot.'/user/filters/lib.php');
		$regnofieldname = 'registrationno';
		$this->profile_filter = new user_filter_profilefield('profile', 'Registration' , false);
		$profile_fields = $this->profile_filter->get_profile_fields();
		if(! $this->regnofieldid = array_search($regnofieldname, $profile_fields)) {
			error('Registration number profile field not found');
		}
	}

	/**
	 * Return a recipient object for the given criteria text. 
	 * Returns an array of possibilities if the recipient text is ambiguous,
	 * or false if none found.
	 * @param string $criteriatext
	 * @return strathcom_recipient
	 */
	public function recipient($criteriatext) {
		$result = array();
				
		if($this->isRegistrationNumber($criteriatext)) {
			if($user = $this->getUserByRegNo($criteriatext)) {
				$recipient = new strathcom_user_operator($criteriatext);
				$recipient->type = 'registration_number';
				$recipient->criteria = array('type' => 'user', 
					'value' => $user->id);
				$recipient->label = fullname($user);
				$result[] = $recipient;
			}
		}
		
		if($this->isDSUsername($criteriatext)) {
			if($user = get_record('user', 'username', "$criteriatext@strath.ac.uk")) {
				$recipient = new strathcom_user_operator($criteriatext);
				$recipient->type = 'ds_username';
				$recipient->id = $user->id;
				$recipient->criteria = array('type' => 'user', 
					'value' => $user->id);
				$recipient->label = fullname($user);
				$result[] = $recipient;
			}
		}
		
		// Try course / group
		$parts = explode('/', trim($criteriatext));
		if($course = get_record('course', 'shortname', $parts[0])) {
			
			if(sizeof($parts) === 1) {
				$recipient = new strathcom_course_operator($criteriatext);
				$recipient->type = 'course';
				$recipient->id = $course->id;
				$recipient->criteria = array('type' => 'course',
														'value' => $course->id);
				$recipient->label = $course->fullname;
				$result[] = $recipient;
			}
			// Group
			elseif(sizeof($parts) === 2) {
				if($group = get_record('groups', 'courseid', $course->id, 'name', $parts[1])) {
					$recipient = new strathcom_operator_base($criteriatext);
					$recipient->type = 'group';
					$recipient->id = $group->id;
					$recipient->criteria = array('type' => 'group',
										'value' => $group->id);
					$recipient->label = $group->name;
					$result[] = $recipient;
				}
			} 
			// Grouping
			elseif(sizeof($parts) === 3) {
				if($grouping = get_record('groupings', 'courseid', $course->id, 'name', $parts[1])) {
					// Actual grouping criterion
					if($parts[2] === '' || $parts[2] === '*') {
						$recipient = new strathcom_operator_base($criteriatext);
						$recipient->type = 'grouping';
						$recipient->id = $grouping->id;
						$recipient->criteria = array('type' => 'grouping',
																'value' => $grouping->id);
						$recipient->label = $parts[0].': '.$grouping->name;
						$result[] = $recipient;
					} elseif($groups = get_records('groupings_groups', 'groupingid', $grouping->id)) {
						foreach($groups as $group) {
							if($testgroup = get_record('groups', 'id', $group->groupid)) {
								if($testgroup->name == $parts[2]) {
									$recipient = new strathcom_operator_base($criteriatext);
									$recipient->type = 'group';
									$recipient->id = $testgroup->id;
									$recipient->criteria = array('type' => 'group',
																			'value' => $testgroup->id);
									$recipient->label = $parts[0].': '.$testgroup->name;
									$result[] = $recipient;
								}
							}
						}
					}
				}
			}
			
		}

		return $result;
	}

	public function isRegistrationNumber($text) {
		if(!is_numeric($text)) return false;
		if(strlen($text) != 9) return false;
		if(!preg_match('/^(19|20)/', $text)) return false;
		return true;
	}

	public function isDSUsername($text) {
		if(preg_match('/[A-Za-z]{3}\d{5}/', $text)) return true;
		if(preg_match('/[A-Za-z]{4}\d{2}/', $text)) return true;
		return false;
	}
	
	private function getUserByRegNo($regno) {
		$params = array('profile' => $this->regnofieldid,
					'operator' => 2,
					'value' => $regno);
		if(! $user = @get_record_select('user', $this->profile_filter->get_sql_filter($params)) ){
			return false;
		} else {
			return $user;
		}
	}

}
