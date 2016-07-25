var dbFile  = require("../node_simple.js");
var express = require('express');
var router = express.Router();
var csrf = require('csurf'); // Cross-Site Request Forgery prevention

var csrfProtection = csrf();
router.use(csrfProtection); // router is protected

// Remove later
var passport_file = require('../config/passport.js');
var bcrypt = require('bcrypt-nodejs');

/* Render/GET homepage. */
router.get('/', function(req, res, next) {
    //addFirstAdmin();
    res.render('index');
    req.session.errors = null;
    req.session.success = null;

});

/* Render/GET about page */
router.get('/about', function(req, res, next) {
    res.render('about');
});

/* Render/GET user_solutions page */
router.get('/user_solutions', function(req, res, next) {
    res.render('user_solutions');
});

//EXAMPLE EXPECTED DATA GIVEN BELOW:
/*[     {courseCode: 'CSC240',
        year: 2016,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
        type: 'Midterm Examination',
        title: 'Thry of Computation' },

        {courseCode: 'CSC240',
        year: 2014,
        term: 'Fall',
        instructors: ['Faith Ellen', 'Tom F.'],
        type: 'Midterm Examination',
        title: 'Thry of Computation' } ]

 */
router.get('/exams/:id', function(req, res, next) {
    var minExamInfoArray = [];
    dbFile.get_all_exams(req.params.id, function (exams) {
        if (exams.length == 0){
            console.log("Nothing was found");
        }
        else {
            //console.log(exams);
            //only pass over the information that is necessary for the exams page
            for (var i = 0; i<exams.length;i++){

                var getInstructors = exams[i].instructors.join(", ");
                var minExamInfo = {     courseCode:exams[i].course_code,
                    year:exams[i].year,
                    term:toProperCase(exams[i].term),
                    instructors: getInstructors,
                    type:toProperCase(exams[i].type) + " Examination",
                    title:exams[i].title,
                    id:exams[i]._id,
                    questionCount : exams[i].questions_count
                };
                //console.log(minExamInfo);
                minExamInfoArray.push(minExamInfo);
            }
        }
        res.render('exams',  {query: req.params.id, result: minExamInfoArray});
    });
});

// WORK IN PROGRESS
router.get('/user/:query', function(req,res,next){
    var query = req.params.query;
    // Need to validate query


    dbFile.search_users(query, function(success, result){
        if(success){
            console.log(result);
            res.render('user_search', {users : result, query : query});
        }else{
            console.log(result);
            res.redirect('/');
        }
    });
});

/* Render/GET search (exam) page */
router.get('/search/:type', function(req, res, next) {

    var searchType = req.params.type;
    console.log(req.query.search);
    console.log(searchType);
    if(searchType == "courses"){
        var courseName = req.query.search;
        res.redirect('/exams/' + courseName);
    }else{
        var userInfo = req.query.search;
        res.redirect('/user/' + userInfo);
    }

});

/* This is a redirect from the exams page, route is generated in exams.hbs
 *
 * EXAMPLE DATA GIVEN BELOW:
 * questions = [{id,count,comments},{id,count,comments}] --> array of "question" objects
 *
 * id = questions number
 * count= number of solutions
 * comments = number of comments*/
router.get('/questions/:exam_id', function (req,res) {
    var examID = req.params.exam_id;
    console.log(examID);
    dbFile.get_exam_byID(examID, function(success, error, exam){

        /* [
         { q_id: 1, question: 'this is q1' },
         { q_id: 2, question: 'this is q2' }
         ]
         */
        var qList = exam.questions_list;

        // Add comments/solutions
        dbFile.get_exam_info_by_ID(examID, function (questionsInfo) {
            qList.forEach(function(question){
                question.count = 0;
                question.comments = 0;

                // Find q_id in questionsInfo, update comment/solutions count
                questionsInfo.forEach(function(q){
                    if (question.q_id == q._id){
                        question.count += q.count;
                        question.comments += q.comments;
                    }
                });
            });

            var examInfo = {
                id : exam._id,
                courseCode : exam.course_code,
                term : toProperCase(exam.term),
                type : toProperCase(exam.type),
                year : exam.year,
                instructors : exam.instructors.join(),
                uploadDate : exam.upload_date,
                uploader : exam.uploaded_by,
                pageCount : exam.page_count,
                questionCount : exam.questions_count
            };
            res.render('questions', {query: qList, examInfo: examInfo});
        });
    });
});

/*GET the solutions for a given exam given the question number and the exam_id

* EXPECTED DATA GIVEN BELOW:
* array of solutions:
* solutions = [ {
    *               _id: "354ff71ed078933079d6467e"
    *               exam_id: "578a44ff71ed097fc3079d6e"
    *               q_id: 1  (int)
    *               text: "answer"
    *               votes: 1 (int)
    *               comments: [{}.{}] (just going to be string for now i think)
    *               author : "text"
    *           }
    *           {
    *                _id: ...
    *               exam_id:  ..
    *               q_id: ...
    *               text: ..
    *               votes: ..
                    comments: ..
                    author : "text"
    *           
    *           }
    *           ]
    *            "comments": []
    *
     A comment:
     {
     "text": "this is asdfasdf",
     "date": {"$date": "2016-07-23T03:55:34.906Z"},
     "by": "some_user name"
     },
    *
    *
router.get('/solutions/:exam_id/:q_num', function (req, res) {
    var examID = req.params.exam_id;
    var qID = req.params.q_num;
    dbFile.get_all_solutions(examID, qID, function (solutions) {
        solutions.forEach(function(soln){
            soln.commentCount = soln.comments.length;
        });
        res.render('user_solutions', {query: solutions, examID: examID, qID: qID, csrfToken: req.csrfToken()});
    });
});

router.post('/add_solutions/submit', function (req, res) {
    //TODO: get the form information for the solutions
});

/**** Helpers ****/

function addFirstAdmin() {
    //console.log("Inside addFirstAdmin()");
    //admin_data = {fname: firstname, lname: lastname, username: username, password: password}
    var password = 'lamptable';
    var hash_pwd = passport_file.encryptPassword(password);
    //console.log("Admin hashed: " + hash_pwd);
    var admin_data = {
        fname: 'Admin',
        lname: 'Admin',
        username: 'admin',
        password: hash_pwd
    };

    dbFile.addAdmin(admin_data, function (success, error, message) {
        console.log("admin message: " + message);
    });
}

function getExamsForCourseCode(courseCode) {
    dbFile.get_all_exams(courseCode, function (exams) {
        if (exams.length == 0){
            console.log("Nothing was found");
        }
        else {
            console.log(exams);
        }
    });
}

function toProperCase(string) {
    return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

module.exports = router;