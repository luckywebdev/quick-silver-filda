import React from 'react'
import { Pagination } from 'react-bootstrap'

/*
    totalPages: number
    currentPage: number
    onChangePage: function
    prevNext: boolean
    firstLast: boolean
*/
function PaginationComponent(props) {
    const {totalPages, currentPage, prevNext, firstLast, onChangePage} = props

    let from = Math.max(currentPage - 2, 1)
    const to = Math.min(from + 4, totalPages)
    if (to == totalPages) {
        from = Math.max(to - 4, 1)
    }

    const list = []
    for (let i = from; i <= to; i++) {
        list.push(i)
    }

    const onUpdatePage = (index) => {
        if (index < 1) {
            onChangePage(1)
        } else if (index > totalPages) {
            onChangePage(totalPages)
        } else {
            onChangePage(index)
        }
    }

    return (
        <Pagination>
            {firstLast !== false && <Pagination.First onClick={()=>onUpdatePage(1)} />}
            {prevNext !== false && <Pagination.Prev onClick={()=>onUpdatePage(currentPage-1)} />}
            {
                list.map((i) => 
                <Pagination.Item key={`PaginationItem-${i}`} active={currentPage === i} onClick={()=>onUpdatePage(i)}>{i}</Pagination.Item>
                )
            }
            {prevNext !== false && <Pagination.Next onClick={()=>onUpdatePage(currentPage+1)}/>}
            {firstLast !== false && <Pagination.Last onClick={()=>onUpdatePage(totalPages)} />}
        </Pagination>
    )
}

export default PaginationComponent
