import React from 'react'
//根据从书架传过来的参数显示图书信息
function Book(props){
	return(
	<div className="book">
	  <div className="book-top">
		<div className="book-cover" style={{backgroundImage: `url(${props.data.cover})` }}></div>
		<div className="book-shelf-changer">
		  <select book={props.data.id} value={props.data.shelf} onChange={(event)=>(props.updateShelf(event))}>
			<option value="" disabled>Move to...</option>
			{props.shelfCategories.map((category)=>(
				<option key={category.key} value={category.key}>{category.name}</option>
			))}
		  </select>
		</div>
	  </div>
	  <div className="book-title">{props.data.title}</div>
	  <div className="book-authors">{props.data.authors}</div>
	</div>
	);
}

export default Book