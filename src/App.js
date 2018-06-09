import React from 'react'
import * as BooksAPI from './BooksAPI'
import { Route, Link } from 'react-router-dom'
import Shelf from './Shelf'							//加载书架类
import './App.css'



class BooksApp extends React.Component {
  state = {
    /**
     * TODO: Instead of using this state variable to keep track of which page
     * we're on, use the URL in the browser's address bar. This will ensure that
     * users can use the browser's back and forward buttons to navigate between
     * pages, as well as provide a good URL they can bookmark and share.
     */
	books:[],	//图书数组，来自getall()
	booksId:{},	//图书id对照表，以图书id作键名，图书数据序号作值{book.id:index}
	//书架分类，key:用于update()接口参数，name:页面显示文字，show:是否显示
	shelfCategories:[{'key':'currentlyReading', 'name':'Currently Reading', 'show':true}, {'key':'wantToRead', 'name':'Want to read', 'show':true}, {'key':'read', 'name':'Read', 'show':true}, {'key':'none', 'name':'None', 'show':false}],
	searchInterval:null,	//搜索定时器
	booksFromSearch:[],		//搜索得到的图书数据
	searchKeyword:'',		//搜索关键字
    showSearchPage: false
  }
  
  componentDidMount(){
	  //添加组件时获取书架上的图书
	  console.log('componentDidMount');
	  BooksAPI.getAll().then(res=>{
		  console.log(res);
		  //绑定图书id和所在数据序号
		  this.sortBooks(res);
		  //this.setState({books:res});
		  });
  }
  
//绑定图书id和所在数据序号
  sortBooks=function(books){
	  
	  let booksId={};
	  for(let i=0; i<books.length; i++){
		  booksId[books[i].id]=i;
	  }
	  this.setState({booksId:booksId, books:books});
	  //console.log(this.state.books);
	  console.log(this.state.booksId);
  }
  
  //更新图书所在书架
  updateShelf=function(event){
	  //获取select所选值和book id，来自自定义属性book，
	  console.log(`${event.target.attributes.getNamedItem('book').value} ${event.target.value}`);
	  if(event.target.attributes.getNamedItem('book').value && event.target.value){
			console.log('update');
			console.log(this.state);
			let that=this;
			let id=event.target.attributes.getNamedItem('book').value;
			let shelf=event.target.value;
			//调用api更新图书书架
			BooksAPI.update({'id':id}, event.target.value)
			.then(res=>{
				console.log(res);
				BooksAPI.getAll().then(res=>{
					console.log(res);
					//完成后更新id和图书数据序号绑定
					that.sortBooks(res);
					//that.setState({books:res});
				});
				return {'id':id, 'shelf':shelf};
			  
			})
			.then(res=>{
				console.log(res);
				//更新搜索页图书的shelf属性
				let books=that.state.booksFromSearch.map(book=>{
					if(book.id===res.id){
						console.log(book);
						book.shelf=res.shelf;
						return book;
					}
					return book;
				});
				console.log(books);
				that.setState({booksFromSearch:books});
			});
	  }
  }
  
  //根据输入关键字搜索图书，结束输入后0.5秒执行搜索，0.5秒内再次输入重置延时时间，避免多余搜索
  onKeywordChange=function(event){
	  console.log(event.target.value);
	  //记录关键字
	  this.setState({searchKeyword:event.target.value});
	  //输入框每次改变重置搜索定时器
	  clearInterval(this.state.searchInterval);
	  this.setState({searchInterval:null});
	  let query=event.target.value;
	  //关键字清空后同步清除搜索图书数组
	  if(! query){
		  this.setState({booksFromSearch:[]});
		return
	  }
	  //输入结束后延时0.5秒执行搜索，避免多余搜索
	  let interval=setInterval(()=>{
		  console.log('do search');
		  BooksAPI.search(query)
		  .then(res=>{
			  console.log(res);
			  if(res.error){
				  this.setState({booksFromSearch:[]});
				  return
			  }
			  res=res.map(data=>{
				  //console.log(this.state.booksId[data.id]);
				  let math=typeof this.state.booksId[data.id];
				  console.log(math);
				  data.shelf=math==='number'?this.state.books[this.state.booksId[data.id]].shelf:'';
				  return data;
			  });
			  this.setState({booksFromSearch:res});
			  console.log(this.state.booksFromSearch);
			});
		  clearInterval(interval);
		  this.setState({searchInterval:null});
	  }, 500);
	  this.setState({searchInterval:interval});
  }
  
  testapi=function(){
	  console.log('testapi');
	  console.log(this.state);
	  let query='lord of the ring';
	  BooksAPI.search(query).then(res=>{console.log(res)});
  }
  

  render() {
    return (
	<div className="app">
	{/* 根目录路由，显示全部书架上的图书 */}
		<Route exact path="/" render={()=>(
			<div className="list-books">
				<div className="list-books-title">
				  <h1>MyReads</h1>
				</div>
			
			{/* 根据书架分类显示全部书架 */}
				{this.state.shelfCategories.map((category, key)=>(
					<Shelf key={key} show={category.show} updateShelf={this.updateShelf.bind(this)} shelfCategories={this.state.shelfCategories} title={category.name} books={this.state.books.filter(book=>{return book.shelf===category.key})} />
				))}
				
				<div className="open-search">
				  <Link to="/search">Add a book</Link>
				</div>
			</div>
		)} />
			
		{/* 搜索页路由 */}
		<Route exact path="/search" render={()=>(
			<div className="search-books">
				<div className="search-books-bar">
				  <Link className="close-search" to="/">Close</Link>
				  <div className="search-books-input-wrapper">
					{/*
					  NOTES: The search from BooksAPI is limited to a particular set of search terms.
					  You can find these search terms here:
					  https://github.com/udacity/reactnd-project-myreads-starter/blob/master/SEARCH_TERMS.md

					  However, remember that the BooksAPI.search method DOES search by title or author. So, don't worry if
					  you don't find a specific author or title. Every search is limited by search terms.
					*/}
					<input type="text" value={this.state.searchKeyword} onChange={(event)=>(this.onKeywordChange(event))} placeholder="Search by title or author"/>
					
				  </div>
				</div>
				{/* 显示搜索书架 */}
				<Shelf show={true} updateShelf={this.updateShelf.bind(this)} shelfCategories={this.state.shelfCategories} title="Search results" books={this.state.booksFromSearch} />
			  </div>
		)} />
		
	</div>
      // <div className="app">
        // {this.state.showSearchPage ? (
          // <div className="search-books">
            // <div className="search-books-bar">
              // <a className="close-search" onClick={() => this.setState({ showSearchPage: false })}>Close</a>
              // <div className="search-books-input-wrapper">
                // {/*
                  // NOTES: The search from BooksAPI is limited to a particular set of search terms.
                  // You can find these search terms here:
                  // https://github.com/udacity/reactnd-project-myreads-starter/blob/master/SEARCH_TERMS.md

                  // However, remember that the BooksAPI.search method DOES search by title or author. So, don't worry if
                  // you don't find a specific author or title. Every search is limited by search terms.
                // */}
                // <input type="text" placeholder="Search by title or author"/>

              // </div>
            // </div>
            // <div className="search-books-results">
              // <ol className="books-grid"></ol>
            // </div>
          // </div>
        // ) : (
          // <div className="list-books">
            // <div className="list-books-title">
              // <h1>MyReads</h1>
            // </div>
            // <div className="list-books-content">
              // <div>
                // <div className="bookshelf">
                  // <h2 className="bookshelf-title">Currently Reading</h2>
                  // <div className="bookshelf-books">
                    // <ol className="books-grid">
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 193, backgroundImage: 'url("http://books.google.com/books/content?id=PGR2AwAAQBAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE73-GnPVEyb7MOCxDzOYF1PTQRuf6nCss9LMNOSWBpxBrz8Pm2_mFtWMMg_Y1dx92HT7cUoQBeSWjs3oEztBVhUeDFQX6-tWlWz1-feexS0mlJPjotcwFqAg6hBYDXuK_bkyHD-y&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">To Kill a Mockingbird</div>
                          // <div className="book-authors">Harper Lee</div>
                        // </div>
                      // </li>
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 188, backgroundImage: 'url("http://books.google.com/books/content?id=yDtCuFHXbAYC&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE72RRiTR6U5OUg3IY_LpHTL2NztVWAuZYNFE8dUuC0VlYabeyegLzpAnDPeWxE6RHi0C2ehrR9Gv20LH2dtjpbcUcs8YnH5VCCAH0Y2ICaKOTvrZTCObQbsfp4UbDqQyGISCZfGN&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">Ender's Game</div>
                          // <div className="book-authors">Orson Scott Card</div>
                        // </div>
                      // </li>
                    // </ol>
                  // </div>
                // </div>
                // <div className="bookshelf">
                  // <h2 className="bookshelf-title">Want to Read</h2>
                  // <div className="bookshelf-books">
                    // <ol className="books-grid">
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 193, backgroundImage: 'url("http://books.google.com/books/content?id=uu1mC6zWNTwC&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE73pGHfBNSsJG9Y8kRBpmLUft9O4BfItHioHolWNKOdLavw-SLcXADy3CPAfJ0_qMb18RmCa7Ds1cTdpM3dxAGJs8zfCfm8c6ggBIjzKT7XR5FIB53HHOhnsT7a0Cc-PpneWq9zX&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">1776</div>
                          // <div className="book-authors">David McCullough</div>
                        // </div>
                      // </li>
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 192, backgroundImage: 'url("http://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE72G3gA5A-Ka8XjOZGDFLAoUeMQBqZ9y-LCspZ2dzJTugcOcJ4C7FP0tDA8s1h9f480ISXuvYhA_ZpdvRArUL-mZyD4WW7CHyEqHYq9D3kGnrZCNiqxSRhry8TiFDCMWP61ujflB&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">Harry Potter and the Sorcerer's Stone</div>
                          // <div className="book-authors">J.K. Rowling</div>
                        // </div>
                      // </li>
                    // </ol>
                  // </div>
                // </div>
                // <div className="bookshelf">
                  // <h2 className="bookshelf-title">Read</h2>
                  // <div className="bookshelf-books">
                    // <ol className="books-grid">
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 192, backgroundImage: 'url("http://books.google.com/books/content?id=pD6arNyKyi8C&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE70Rw0CCwNZh0SsYpQTkMbvz23npqWeUoJvVbi_gXla2m2ie_ReMWPl0xoU8Quy9fk0Zhb3szmwe8cTe4k7DAbfQ45FEzr9T7Lk0XhVpEPBvwUAztOBJ6Y0QPZylo4VbB7K5iRSk&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">The Hobbit</div>
                          // <div className="book-authors">J.R.R. Tolkien</div>
                        // </div>
                      // </li>
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 174, backgroundImage: 'url("http://books.google.com/books/content?id=1q_xAwAAQBAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE712CA0cBYP8VKbEcIVEuFJRdX1k30rjLM29Y-dw_qU1urEZ2cQ42La3Jkw6KmzMmXIoLTr50SWTpw6VOGq1leINsnTdLc_S5a5sn9Hao2t5YT7Ax1RqtQDiPNHIyXP46Rrw3aL8&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">Oh, the Places You'll Go!</div>
                          // <div className="book-authors">Seuss</div>
                        // </div>
                      // </li>
                      // <li>
                        // <div className="book">
                          // <div className="book-top">
                            // <div className="book-cover" style={{ width: 128, height: 192, backgroundImage: 'url("http://books.google.com/books/content?id=32haAAAAMAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE72yckZ5f5bDFVIf7BGPbjA0KYYtlQ__nWB-hI_YZmZ-fScYwFy4O_fWOcPwf-pgv3pPQNJP_sT5J_xOUciD8WaKmevh1rUR-1jk7g1aCD_KeJaOpjVu0cm_11BBIUXdxbFkVMdi&source=gbs_api")' }}></div>
                            // <div className="book-shelf-changer">
                              // <select>
                                // <option value="none" disabled>Move to...</option>
                                // <option value="currentlyReading">Currently Reading</option>
                                // <option value="wantToRead">Want to Read</option>
                                // <option value="read">Read</option>
                                // <option value="none">None</option>
                              // </select>
                            // </div>
                          // </div>
                          // <div className="book-title">The Adventures of Tom Sawyer</div>
                          // <div className="book-authors">Mark Twain</div>
                        // </div>
                      // </li>
                    // </ol>
                  // </div>
                // </div>
              // </div>
            // </div>
            // <div className="open-search">
              // <a onClick={() => this.setState({ showSearchPage: true })}>Add a book</a>
            // </div>
          // </div>
        // )}
      // </div>
    )
  }
}

export default BooksApp
