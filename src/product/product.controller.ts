import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('product')
export class ProductController {
  constructor(
    private productService: ProductService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imageUrl: string;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);

      imageUrl = uploadResult.secure_url;

      createProductDto.image = imageUrl;
    }

    return this.productService.create(createProductDto);
  }

  @Get() @UseGuards(JwtAuthGuard) findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imageUrl: string;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);

      imageUrl = uploadResult.secure_url;

      updateProductDto.image = imageUrl;
    }

    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id') @UseGuards(JwtAuthGuard) remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
