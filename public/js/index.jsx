var PullRequest = React.createClass({
    render: function() {
        return (
            <a className="list-group-item" href={this.props.data.html_url}>
                <p>{this.props.data.title}</p>
                <small className="list-group-item-text">#{this.props.data.number} by {this.props.data.user.login}</small>
            </a>
        );
    }
});

var AddRepositoryForm = React.createClass({
    handleSubmit: function(e) {
        e.preventDefault();
        var matches = this.refs.repo.getDOMNode().value.trim().match(/(\S+)\/(\S+)/);
        if (matches.length == 3) {
            var owner = matches[1];
            var repo = matches[2];
            this.props.onRepositorySubmit({owner: owner, repo: repo});
            this.refs.repo.getDOMNode().value = '';
        } else {
            // TODO indicate text box
        }
    },
    render: function() {
        return (
            <form className="form-inline" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <label className="sr-only">Subscribe other repository</label>
                    <input className="form-control" type="text" ref="repo" placeholder="ex. owner/repo"></input>
                </div>
                <button className="btn btn-primary" type="submit">Add</button>
            </form>
        );
    }
});

var RepositoryList = React.createClass({
    getInitialState: function() {
        return {data: [
            //{name: 'mtgto/test', pulls: [
            //    {"title":"test1","number":123,"user":{"login":"user1"},"html_url":"https://github.com/mtgto/test/pulls/1"},
            //    {"title":"test2","number":45,"user":{"login":"user2"},"html_url":"https://github.com/mtgto/test/pulls/2"}
            //]},
            //{name: 'mtgto/test2', pulls: [
            //    {"title":"test3","number":123,"user":{"login":"user1"},"html_url":"https://github.com/mtgto/test/pulls/1"},
            //    {"title":"test4","number":45,"user":{"login":"user2"},"html_url":"https://github.com/mtgto/test/pulls/2"}
            //]}
        ]};
    },
    componentDidMount: function() {
        $.ajax({
            url: 'api/pulls',
            dataType: 'json',
            success: function(data) {
                this.setState({data: data});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    handleRepositorySubmit: function(repository) {
        console.log("onRepositorySubmit(" + JSON.stringify(repository) + ")");
        console.log("state(" + JSON.stringify(this.state) + ")");
        $.ajax({
            type: 'POST',
            url: 'api/repos/add',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({ owner: repository.owner, repo: repository.repo }),
            success: function(data) {
                var newData = this.state.data.slice();
                newData.push(data);
                console.log('data = ' + JSON.stringify(data));
                console.log('newData = ' + JSON.stringify(newData));
                this.setState({data: newData});
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function() {
        var repositoryNodes = this.state.data.map(function(repository) {
            var pullRequestNodes = null;
            if (repository.pulls.length > 0) {
                pullRequestNodes = repository.pulls.map(function(pullRequest) {
                    return (
                        <PullRequest data={pullRequest}/>
                    );
                });
            } else {
                pullRequestNodes =
                    <div className="panel-body">No open pull request</div>;
            }
            return (
                <div className="panel panel-default">
                    <div className="panel-heading">
                    {repository['name']}
                        <a className="button pull-right" name="unsubscribe" repository="{repository['name']}">Unsubscribe</a>
                    </div>
                    {pullRequestNodes}
                </div>
            )
        });
        return (
            <div className="row">
                <h2>Watching2</h2>
                {repositoryNodes}
                <h3>Subscribe other repository</h3>
                <AddRepositoryForm onRepositorySubmit={this.handleRepositorySubmit}/>
            </div>
        );
    }
});
React.render(
    <RepositoryList />,
    document.getElementById('content')
);
