import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { bookmarksdata } from './data';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-bookmarklist',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule, ReactiveFormsModule],
  templateUrl: './bookmarklist.component.html',
  styleUrl: './bookmarklist.component.scss'
})
export class BookmarklistComponent implements OnInit {
  bookmarks_data = bookmarksdata;
  filteredData: any = [];
  bookmarks: any = [];
  currentPage = 1;
  itemsPerPage = 6;
  totalPages!: number;
  addBookmarkForm!: FormGroup;
  addCategoryForm!: FormGroup;

  private modalService = inject(NgbModal);
  private form_builder = inject(FormBuilder);

  ngOnInit(): void {
    this.filteredData = this.bookmarks_data.flatMap(folder => folder.children.map(child => ({ ...child, folderTitle: folder.title })));
    this.displayBookmarks(this.filteredData, this.currentPage);

    this.addBookmarkForm = this.form_builder.group({
      bookmarkTitle: [null, Validators.required],
      bookmarkURL: [null, Validators.required],
      bookmarkIcon: [null],
      bookmarkFolder: [null, Validators.required],
    })

    this.addCategoryForm = this.form_builder.group({
      categoryTitle: [null, Validators.required],
    })
  }

  displayBookmarks(data: Array<any>, page: number) {
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const paginatedData = data.slice(start, end);

    const categorizedData = paginatedData.reduce((acc, bookmark) => {
      const folderTitle = bookmark.folderTitle || 'Uncategorized';
      if (!acc[folderTitle]) {
        acc[folderTitle] = [];
      }
      acc[folderTitle].push(bookmark);
      return acc;
    }, {});

    this.bookmarks = Object.keys(categorizedData).map(folderTitle => ({
      folderTitle,
      links: categorizedData[folderTitle]
    }));

    this.displayPagination(this.filteredData.length);

  }

  displayPagination(totalItems: number) {
    this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
  }

  changePage(event: any) {
    this.currentPage = event;
    this.displayBookmarks(this.filteredData, this.currentPage);
  }

  deleteBookmark(title: string) {
    const index = this.filteredData.findIndex((bookmark: any) => bookmark.title === title);
    if (index !== -1) {
      this.filteredData.splice(index, 1);
      this.displayBookmarks(this.filteredData, this.currentPage);
    }
  };

  filterBookmarks(event: any) {
    this.filteredData = this.bookmarks_data.flatMap(folder => folder.children.map(child => ({ ...child, folderTitle: folder.title })))
      .filter(bookmark => bookmark.title.toLowerCase().includes(event.target.value.toLowerCase()));
    this.displayBookmarks(this.filteredData, 1);
  };

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/32?text=B';
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content);
  }


  onAddBookmark(form: FormGroup) {
    if (form.invalid) return;
    const title = form.value.bookmarkTitle;
    const url = form.value.bookmarkURL;
    const icon = form.value.bookmarkIcon;
    const folderTitle = form.value.bookmarkFolder;
    this.addBookmark(title, url, icon, folderTitle);
    this.modalService.dismissAll();
    form.reset();
  }


  addBookmark(title: string, url: string, icon: string, folderTitle: string) {
    const folder = this.bookmarks_data.find(folder => folder.title === folderTitle);
    if (folder) {
      folder.children.push({ type: 'link', addDate: this.getDate(), title, url, icon });
    } else {
      this.bookmarks_data.push({
        type: 'folder',
        title: folderTitle,
        "addDate": this.getDate(),
        "lastModified": this.getDate(),
        children: [{ type: 'link', addDate: this.getDate(), title, url, icon }]
      });
    }
    this.filteredData = this.bookmarks_data.flatMap(folder => folder.children.map(child => ({ ...child, folderTitle: folder.title })));
    this.displayBookmarks(this.filteredData, this.currentPage);
  };

  getDate() {
    // Get the current date
    const now = new Date();

    // Get the Unix timestamp (in seconds)
    const unixTimestamp = Math.floor(now.getTime() / 1000);

    return unixTimestamp;
  }

  onAddCategory(form: FormGroup) {
    if (form.invalid) return;
    const title = form.value.categoryTitle;
    this.addCategory(title);
    this.modalService.dismissAll();
    form.reset();
  }

  addCategory(title: string) {
    this.bookmarks_data.push({
      type: 'folder',
      title,
      "addDate": this.getDate(),
      "lastModified": this.getDate(),
      children: []
    });
    this.filteredData = this.bookmarks_data.flatMap(folder => folder.children.map(child => ({ ...child, folderTitle: folder.title })));
    this.displayBookmarks(this.filteredData, this.currentPage);
  };

}
