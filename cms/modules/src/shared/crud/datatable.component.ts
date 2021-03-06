import { ContentTypeService } from '@angular-cms/core';
import { Component, Input, OnInit } from '@angular/core';
import { ColumnMetadata } from '../../decorators/column.decorator';

export interface ColumnSettings extends ColumnMetadata {
    name: string;
}

@Component({
    selector: 'cms-table',
    templateUrl: 'datatable.component.html'
})
export class DataTableComponent implements OnInit {
    @Input() modelType: new () => any;
    @Input() rows: any[];

    columns: ColumnSettings[];
    constructor(private contentTypeService: ContentTypeService) { }

    ngOnInit() {
        this.columns = this.contentTypeService.getContentTypeProperties(this.modelType).map(x => ({ name: x.name, ...x.metadata }));
    }
}
