$(function () {
    $('a[name=unsubscribe]').click(function(e) {
        var match = $(this).attr('repository').match(/(\w+)\/(\w+)/);
        if (match.length == 3) {
            var owner = match[1];
            var repo = match[2];
            $.ajax({
                type: 'POST',
                url: 'api/repos/delete',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({ owner: owner, repo: repo }),
                success: function(data) {
                    // TODO refresh view
                }
            });
        } else {
            // TODO indicate text box
        }
    });

    $('button[name=subscribe]').click(function(e) {
        var match = $('input[name=repo]').val().match(/(\S+)\/(\S+)/);
        if (match.length == 3) {
            var owner = match[1];
            var repo = match[2];
            $.ajax({
                type: 'POST',
                url: 'api/repos/add',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({ owner: owner, repo: repo }),
                success: function(json) {
                    // TODO refresh view
                }
            });
        } else {
            // TODO indicate text box
        }
        return false;
    });
});
