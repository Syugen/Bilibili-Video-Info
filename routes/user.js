'use strict';

var http = require("http");
var decompressResponse = require('decompress-response');
var DomParser = require('dom-parser');
var parser = new DomParser();

exports.getUserVideoList = function(req, res) {
    if (!req.query.uid) return res.render("user", {queryError: "uid"});

    var n = req.query.page ? req.query.page : 1;
    var host = "space.bilibili.com";
    var path = "/ajax/member/getSubmitVideos?mid=" + req.query.uid + 
              "&pagesize=150&tid=0&page=" + n + "&order=pubdate";
    httpGetTemplate(res, "user", host, path, req.query.uid);
}

exports.getUserFollowing = function(req, res) {
    if (!req.query.uid) return res.render("error", {queryError: "uid"});
    else return res.render("follow", {type: "followings", uid: req.query.uid,
                                      scripts: ["user_amount", "follow"]});
}

exports.getUserFollower = function(req, res) {
    if (!req.query.uid) return res.render("error", {queryError: "uid"});
    else return res.render("follow", {type: "followers", uid: req.query.uid,
                                      scripts: ["user_amount", "follow"]});
}

function httpGetTemplate(res, page, host, path, uid) {
    var options = {host: host, path: path};

    var req = http.get(options, function(data) {
        data = decompressResponse(data);
        if (data.statusCode != 200) {
            page = page == "following" || page == "follower" ? "follow" : page;
            return res.render(page, {errorCode: data.statusCode});
        }
        var output = "";
        data.on('data', function(chunk) {
            output += chunk.toString();
        }).on('end', function() {
            var rs = JSON.parse(output);
            rs.requestedPage = page;  // Just in case renders needs to know
            if (page == "following" || page == "follower") {
                getFollowAmount(res, uid, rs);
            } else return res.render(page, rs);
        });
    });
}

function getFollowAmount(res, uid, follow_json) {
    var options = {host: "api.bilibili.com",
                   path: "/x/relation/stat?vmid=" + uid};
    var req = http.get(options, function(data) {
        data = decompressResponse(data);
        if (data.statusCode != 200) {
            return res.render("follow", {errorCode: data.statusCode});
        }
        var output = "";
        data.on('data', function(chunk) {
            output += chunk.toString();
        }).on('end', function() {
            var rs = JSON.parse(output);
            follow_json.following = rs.data.following;
            follow_json.follower = rs.data.follower;
            return res.render("follow", follow_json);
        });
    });

}
