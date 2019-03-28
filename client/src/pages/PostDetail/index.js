import React from "react";
import Comment from "../../components/Comment";
import CommentWrapper from "../../components/CommentWrapper";
import API from "../../services/APIService";
import { TextArea } from "../../components/TextArea";
import { Link } from "react-router-dom";

import FirebaseContext from "../../components/Firebase/context";
import LockScreen from "../../components/LockScreen";
import './style.css'
import Moment from 'react-moment';

class PostDetail extends React.Component {
  state = {
    userId: "",
    title: "",
    body: "",
    author: "",
    comments: [],
    inputValue: "",
    userImage: "",
    postDate: ""
  };

  componentDidMount = () => {
    window.scrollTo(0, 0);
    this.lockScreen.lock();
    // getCommentsByPostId
    const id = this.props.match.params.postId;
    // api call here using this prop, set it to state
    API.findOnePost(id).then(post => {
      console.log(post);
      this.setState({
        userId: post.data.userId._id,
        author: post.data.userId.displayName,
        title: post.data.title,
        body: post.data.body,
        userImage: post.data.userId.image,
        postDate: post.data.date
      });
      this.lockScreen.unlock();
    });
    this.refreshComments();
  };

  refreshComments = () => {
    this.lockScreen.lock();

    // getCommentsByPostId
    const id = this.props.match.params.postId;

    API.getCommentsByPostId(id).then(res => {
      this.setState({ comments: res.data });
      this.lockScreen.unlock();
    });
  };

  handleInputChange = e => {
    const { name, value } = e.target;
    this.setState({
      [name]: value
    });
  };

  handleCommentSubmit = e => {
    e.preventDefault();
    const postId = this.props.match.params.postId;

    if (postId) {
      const newComment = {
        body: this.state.inputValue,
        userId: this.firebase.dbUserInfo._id
      };

      this.lockScreen.lock();

      API.createAComment(postId, newComment)
        .then(() => {
          window.ioSocket.emit(
            "message",
            `${this.firebase.dbUserInfo.displayName} just added a comment to "${this.state.title}!"`

          );
          this.setState({ inputValue: "" })
          this.refreshComments();
        })
        .catch(err => {
          console.log(err);
          window.M.toast({ html: "Error sending comment request" });
          this.lockScreen.unlock();
        });
    } else {
      window.M.toast({ html: "Please enter required fields" });
    }
  };

  render() {
    return (
      <FirebaseContext.Consumer>
        {firebase => {
          this.firebase = firebase;

          return (
            <div className="addACommentPage marginTopMedium">
              <div className="container">
                <Link to={"/"}><i className="small material-icons arrow marginBottomMedium backArrow">arrow_back</i></Link>
                <div className="row">
                  <div className="col l12 text-center header">
                    <div className="valign-wrapper">
                      <div id="postDetailPostImageContainer">
                        <img id="postDetailPostImage" src={this.state.userImage} alt="" className="circle" />
                      </div>
                      <div id="postDetailPostPersonContainer">
                        <div id="postDetailPostAuthor">{this.state.author}</div>
                        <div id="postDetailPostDate">
                          {this.state.postDate &&
                            <Moment calendar>{this.state.postDate}</Moment>
                          }
                        </div>
                      </div>
                    </div>
                    <h1 className="comment-title">{this.state.title}</h1>
                    <h5>{this.state.body}</h5>
                  </div>
                </div>

                {firebase.firebaseUserInfo &&
                  <TextArea
                    value={this.state.inputValue}
                    name="inputValue"
                    handleInputChange={this.handleInputChange}
                    buttonName={"Reply"}
                    label={"Post a reply"}
                    handleFormSubmit={this.handleCommentSubmit}
                  />
                }

                <CommentWrapper>
                  {this.state.comments.map(comment => (
                    <Comment
                      key={comment._id}
                      body={comment.body}
                      date={comment.date}
                      user={comment.userId.displayName}
                      userImage={comment.userId.image}
                    />
                  ))}
                </CommentWrapper>
              </div>
              <LockScreen
                id="addPostLockScreen"
                ref={lockScreen => (this.lockScreen = lockScreen)}
              />
            </div>
          );

        }}
      </FirebaseContext.Consumer>
    );
  }
}

export default PostDetail;
