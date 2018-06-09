import React from 'react'
import Book from './Book'	//图书组件
function Sheft(props){
	if(props.show){
		return (
		<div className="list-books-content">
			<div>
				<div className="bookshelf">
				  <h2 className="bookshelf-title">{props.title}</h2>
				  <div className="bookshelf-books">
					<ol className="books-grid">
					{
						//根据传过来的参数显示全部图书
					}
						{props.books.map((book)=>(
						<li key={book.id}>
							<Book shelfCategories={props.shelfCategories} updateShelf={props.updateShelf} data={{'title':book.title, 'authors':book.authors, 'cover':(book.imageLinks?book.imageLinks.thumbnail:''), 'id':book.id, 'shelf':book.shelf}} />
						</li>
						))}
					</ol>
				  </div>
				</div>
			</div>
		</div>
		);
	}
	return (
	''
	);
}

export default Sheft